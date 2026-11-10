import { randomBytes } from 'node:crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getDatabasePool } from '../config/database.js'
import { MOCK_ORDER_CATALOG } from '../data/mock-order-catalog.js'

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'
type ProductSource = 'mock' | 'cheapshark'

interface OrderItemInput {
  gameId: string
  source: ProductSource
  quantity: number
  expectedUnitPrice: number
}

interface OrderGameRow extends RowDataPacket {
  id: number | string
}

interface ResolvedOrderItem {
  gameId: string
  title: string
  unitPriceCents: number
  originalUnitPriceCents: number
  quantity: number
}

export interface CreatedOrder {
  orderNumber: string
  currency: 'BRL'
  subtotal: number
  discountTotal: number
  total: number
  items: {
    gameId: string
    title: string
    unitPrice: number
    quantity: number
  }[]
}

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'OrderError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePaymentMethod(value: unknown): PaymentMethod {
  if (value === 'pix' || value === 'credit_card' || value === 'boleto') {
    return value
  }

  throw new OrderError('Forma de pagamento demonstrativa inválida.', 400, 'INVALID_PAYMENT_METHOD')
}

function parseOrderItems(value: unknown): OrderItemInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new OrderError(
      'O pedido deve conter entre 1 e 50 produtos.',
      400,
      'INVALID_ITEMS',
    )
  }

  const seenGameIds = new Set<string>()
  return value.map((item): OrderItemInput => {
    if (!isRecord(item)) {
      throw new OrderError('Um item do pedido é inválido.', 400, 'INVALID_ITEM')
    }

    const { gameId, source, quantity, expectedUnitPrice } = item
    if (
      typeof gameId !== 'string' ||
      gameId.trim().length === 0 ||
      gameId.length > 150
    ) {
      throw new OrderError('Identificador de jogo inválido.', 400, 'INVALID_GAME_ID')
    }

    if (source !== 'mock' && source !== 'cheapshark') {
      throw new OrderError('Origem do jogo inválida.', 400, 'INVALID_GAME_SOURCE')
    }

    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      throw new OrderError(
        'A quantidade deve ser um inteiro entre 1 e 99.',
        400,
        'INVALID_QUANTITY',
      )
    }

    if (
      typeof expectedUnitPrice !== 'number' ||
      !Number.isFinite(expectedUnitPrice) ||
      expectedUnitPrice < 0
    ) {
      throw new OrderError('Preço exibido inválido.', 400, 'INVALID_EXPECTED_PRICE')
    }

    const normalizedGameId = gameId.trim()
    if (seenGameIds.has(normalizedGameId)) {
      throw new OrderError(
        'Cada jogo deve aparecer uma única vez no pedido.',
        400,
        'DUPLICATE_GAME',
      )
    }
    seenGameIds.add(normalizedGameId)

    return {
      gameId: normalizedGameId,
      source,
      quantity,
      expectedUnitPrice,
    }
  })
}

function resolveOrderItems(items: OrderItemInput[]): ResolvedOrderItem[] {
  return items.map((item) => {
    if (item.source === 'cheapshark') {
      throw new OrderError(
        'Este jogo ainda não pode ser comprado: não há uma cotação confirmada em BRL.',
        422,
        'PRICE_QUOTE_UNAVAILABLE',
      )
    }

    const product = MOCK_ORDER_CATALOG.find((game) => game.id === item.gameId)
    if (!product) {
      throw new OrderError(
        'O jogo não está disponível no catálogo de preços confirmado.',
        422,
        'PRODUCT_UNAVAILABLE',
      )
    }

    const expectedPriceCents = Math.round(item.expectedUnitPrice * 100)
    if (expectedPriceCents !== product.priceCents) {
      throw new OrderError(
        'O preço deste jogo mudou. Revise o carrinho antes de continuar.',
        409,
        'PRICE_CHANGED',
      )
    }

    return {
      gameId: product.id,
      title: product.title,
      unitPriceCents: product.priceCents,
      originalUnitPriceCents: product.originalPriceCents,
      quantity: item.quantity,
    }
  })
}

function formatCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

function isDuplicateKeyError(error: unknown): boolean {
  return isRecord(error) && error.code === 'ER_DUP_ENTRY'
}

function createOrderNumber(): string {
  return `GZ-${randomBytes(8).toString('hex').toUpperCase()}`
}

export async function createOrder(
  userId: string,
  input: unknown,
): Promise<CreatedOrder> {
  if (!/^\d{1,20}$/.test(userId)) {
    throw new OrderError('Sessão de usuário inválida.', 401, 'INVALID_SESSION')
  }

  if (!isRecord(input)) {
    throw new OrderError('Dados do pedido inválidos.', 400, 'INVALID_ORDER')
  }

  const items = parseOrderItems(input.items)
  const paymentMethod = parsePaymentMethod(input.paymentMethod)
  const resolvedItems = resolveOrderItems(items)

  const subtotalCents = resolvedItems.reduce(
    (sum, item) => sum + item.originalUnitPriceCents * item.quantity,
    0,
  )
  const totalCents = resolvedItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  )
  const discountCents = subtotalCents - totalCents

  if (![subtotalCents, totalCents, discountCents].every(Number.isSafeInteger)) {
    throw new OrderError(
      'Os valores do pedido excedem o limite permitido.',
      400,
      'ORDER_TOTAL_TOO_LARGE',
    )
  }

  const connection = await getDatabasePool().getConnection()
  let transactionStarted = false

  try {
    await connection.beginTransaction()
    transactionStarted = true

    let orderNumber = ''
    let orderId: number | string | undefined

    for (let attempt = 0; attempt < 3; attempt += 1) {
      orderNumber = createOrderNumber()
      try {
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO orders
            (order_number, user_id, status, payment_method, subtotal, discount_total, total)
           VALUES (?, ?, 'completed', ?, ?, ?, ?)`,
          [
            orderNumber,
            userId,
            paymentMethod,
            formatCents(subtotalCents),
            formatCents(discountCents),
            formatCents(totalCents),
          ],
        )
        orderId = result.insertId
        break
      } catch (error) {
        if (!isDuplicateKeyError(error) || attempt === 2) {
          throw error
        }
      }
    }

    if (orderId === undefined) {
      throw new OrderError(
        'Não foi possível gerar um identificador único para o pedido.',
        503,
        'ORDER_NUMBER_UNAVAILABLE',
      )
    }

    for (const item of resolvedItems) {
      const [gameRows] = await connection.execute<OrderGameRow[]>(
        'SELECT id FROM games WHERE source = ? AND source_game_id = ? LIMIT 1',
        ['mock', item.gameId],
      )
      const gameId = gameRows[0]?.id ?? null

      await connection.execute<ResultSetHeader>(
        `INSERT INTO order_items
          (order_id, game_id, game_title, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          gameId,
          item.title,
          formatCents(item.unitPriceCents),
          item.quantity,
        ],
      )
    }

    await connection.commit()
    transactionStarted = false

    return {
      orderNumber,
      currency: 'BRL',
      subtotal: subtotalCents / 100,
      discountTotal: discountCents / 100,
      total: totalCents / 100,
      items: resolvedItems.map((item) => ({
        gameId: item.gameId,
        title: item.title,
        unitPrice: item.unitPriceCents / 100,
        quantity: item.quantity,
      })),
    }
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Não foi possível reverter a transação do pedido.', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}
