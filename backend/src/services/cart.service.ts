import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getDatabasePool } from '../config/database.js'
import {
  ensureGame,
  findGame,
  GamePersistenceError,
  mapGameRow,
  normalizeExternalId,
  parseGameSource,
  parsePersistedGame,
  type GameSource,
  type PersistedGame,
} from './games.service.js'

export interface CartItem {
  game: PersistedGame
  quantity: number
}

interface CartRow extends RowDataPacket {
  quantity: number
  source: GameSource
  id: string
  title: string
  coverUrl: string
  price: number | string
  originalPrice: number | string | null
  discountPercentage: number | null
  genre: unknown
  platforms: unknown
  rating: number | string | null
  releaseDate: string | Date | null
  description: string | null
  isFeatured: number | boolean
  isOffer: number | boolean
}

export class CartError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'CartError'
  }
}

function validateUserId(userId: string): void {
  if (!/^\d{1,20}$/.test(userId)) {
    throw new CartError('Sessão de usuário inválida.', 401, 'INVALID_SESSION')
  }
}

function parseIdentity(sourceValue: string, idValue: string): {
  source: GameSource
  id: string
} {
  const source = parseGameSource(sourceValue)
  if (!source) {
    throw new CartError('Origem do jogo inválida.', 400, 'INVALID_GAME_SOURCE')
  }

  try {
    return { source, id: normalizeExternalId(idValue) }
  } catch (error) {
    if (error instanceof GamePersistenceError) {
      throw new CartError(error.message, error.statusCode, error.code)
    }
    throw error
  }
}

async function getCartId(userId: string, create: boolean): Promise<string | undefined> {
  const pool = getDatabasePool()
  if (create) {
    await pool.execute<ResultSetHeader>(
      'INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [userId],
    )
  }

  const [rows] = await pool.execute<Array<RowDataPacket & { id: string }>>(
    'SELECT id FROM carts WHERE user_id = ? LIMIT 1',
    [userId],
  )
  return rows[0] ? String(rows[0].id) : undefined
}

export async function getCart(userId: string): Promise<CartItem[]> {
  validateUserId(userId)
  const cartId = await getCartId(userId, false)
  if (!cartId) {
    return []
  }

  const [rows] = await getDatabasePool().execute<CartRow[]>(
    `SELECT ci.quantity, g.source, g.source_game_id AS id, g.title,
      g.cover_url AS coverUrl, g.price, g.original_price AS originalPrice,
      g.discount_percentage AS discountPercentage, g.genre, g.platforms, g.rating,
      g.release_date AS releaseDate, g.description, g.is_featured AS isFeatured,
      g.is_offer AS isOffer
     FROM cart_items ci
     INNER JOIN games g ON g.id = ci.game_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id`,
    [cartId],
  )

  return rows.map((row) => ({
    game: mapGameRow(row),
    quantity: row.quantity,
  }))
}

export async function addCartItem(userId: string, input: unknown): Promise<CartItem[]> {
  validateUserId(userId)
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new CartError('Dados do item inválidos.', 400, 'INVALID_ITEM')
  }

  const game = parsePersistedGame((input as Record<string, unknown>).game)
  const connection = await getDatabasePool().getConnection()
  let transactionStarted = false

  try {
    await connection.beginTransaction()
    transactionStarted = true
    const storedGame = await ensureGame(connection, game)

    await connection.execute<ResultSetHeader>(
      'INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [userId],
    )
    const [cartRows] = await connection.execute<Array<RowDataPacket & { id: string }>>(
      'SELECT id FROM carts WHERE user_id = ? LIMIT 1',
      [userId],
    )
    const cartId = cartRows[0]?.id
    if (!cartId) {
      throw new Error('O carrinho não foi encontrado após a gravação.')
    }

    const [existingRows] = await connection.execute<
      Array<RowDataPacket & { quantity: number }>
    >('SELECT quantity FROM cart_items WHERE cart_id = ? AND game_id = ? FOR UPDATE', [
      cartId,
      storedGame.id,
    ])
    if (existingRows[0]?.quantity >= 99) {
      throw new CartError(
        'A quantidade máxima permitida para este jogo é 99.',
        409,
        'MAX_QUANTITY',
      )
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO cart_items (cart_id, game_id, quantity) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + 1, 99)`,
      [cartId, storedGame.id],
    )
    await connection.commit()
    transactionStarted = false
    return getCart(userId)
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Não foi possível reverter a alteração do carrinho.', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function updateCartItem(
  userId: string,
  sourceValue: string,
  idValue: string,
  quantity: unknown,
): Promise<CartItem[]> {
  validateUserId(userId)
  const { source, id } = parseIdentity(sourceValue, idValue)

  if (
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 99
  ) {
    throw new CartError('A quantidade deve ser um inteiro entre 0 e 99.', 400, 'INVALID_QUANTITY')
  }

  const connection = await getDatabasePool().getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    const [cartRows] = await connection.execute<
      Array<RowDataPacket & { id: string }>
    >('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId])
    const cartId = cartRows[0] ? String(cartRows[0].id) : undefined
    const storedGame = cartId ? await findGame(connection, source, id) : undefined
    if (cartId && storedGame) {
      if (quantity === 0) {
        await connection.execute<ResultSetHeader>(
          'DELETE FROM cart_items WHERE cart_id = ? AND game_id = ?',
          [cartId, storedGame.id],
        )
      } else {
        await connection.execute<ResultSetHeader>(
          'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND game_id = ?',
          [quantity, cartId, storedGame.id],
        )
      }
    }
    await connection.commit()
    transactionStarted = false
    return getCart(userId)
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Não foi possível reverter a alteração do carrinho.', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function removeCartItem(
  userId: string,
  sourceValue: string,
  idValue: string,
): Promise<CartItem[]> {
  validateUserId(userId)
  const { source, id } = parseIdentity(sourceValue, idValue)
  await getDatabasePool().execute<ResultSetHeader>(
    `DELETE ci FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     INNER JOIN games g ON g.id = ci.game_id
     WHERE c.user_id = ? AND g.source = ? AND g.source_game_id = ?`,
    [userId, source, id],
  )
  return getCart(userId)
}

export async function clearCart(userId: string): Promise<CartItem[]> {
  validateUserId(userId)
  await getDatabasePool().execute<ResultSetHeader>(
    'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = ? LIMIT 1)',
    [userId],
  )
  return []
}
