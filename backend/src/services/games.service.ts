import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { MOCK_ORDER_CATALOG } from '../data/mock-order-catalog.js'

export type GameSource = 'mock' | 'cheapshark'

export interface PersistedGameInput {
  id: string
  source: GameSource
  title: string
  coverUrl: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  genre: string[]
  platforms: string[]
  rating?: number
  releaseDate?: string
  description?: string
  isFeatured?: boolean
  isOffer?: boolean
}

export type PersistedGame = PersistedGameInput

interface GameRow extends RowDataPacket {
  id: string
  databaseId?: string
  source: GameSource
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

export class GamePersistenceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'GamePersistenceError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(
  value: unknown,
  field: string,
  maximumLength: number,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    throw new GamePersistenceError(`Campo de jogo inválido: ${field}.`, 400, 'INVALID_GAME')
  }

  return value.trim()
}

function optionalNumber(
  value: unknown,
  field: string,
  maximum: number,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new GamePersistenceError(`Campo de jogo inválido: ${field}.`, 400, 'INVALID_GAME')
  }

  return value
}

function stringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 30 ||
    !value.every(
      (item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 80,
    )
  ) {
    throw new GamePersistenceError(`Campo de jogo inválido: ${field}.`, 400, 'INVALID_GAME')
  }

  return value.map((item: string) => item.trim())
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'boolean') {
    throw new GamePersistenceError(`Campo de jogo inválido: ${field}.`, 400, 'INVALID_GAME')
  }

  return value
}

function parseReleaseDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new GamePersistenceError('Data de lançamento inválida.', 400, 'INVALID_GAME')
  }

  return value
}

export function parsePersistedGame(value: unknown): PersistedGameInput {
  if (!isRecord(value)) {
    throw new GamePersistenceError('Dados do jogo inválidos.', 400, 'INVALID_GAME')
  }

  const id = requiredString(value.id, 'id', 150)
  const source = value.source
  if (source !== 'mock' && source !== 'cheapshark') {
    throw new GamePersistenceError('Origem do jogo inválida.', 400, 'INVALID_GAME_SOURCE')
  }

  const submittedTitle = requiredString(value.title, 'title', 255)
  const coverUrl = requiredString(value.coverUrl, 'coverUrl', 2048)
  const mockProduct = source === 'mock'
    ? MOCK_ORDER_CATALOG.find((product) => product.id === id)
    : undefined
  if (source === 'mock' && !mockProduct) {
    throw new GamePersistenceError('Jogo mock não reconhecido.', 422, 'PRODUCT_UNAVAILABLE')
  }
  const submittedPrice =
    source === 'cheapshark'
      ? optionalNumber(value.price, 'price', 99_999_999.99)
      : undefined
  const submittedOriginalPrice =
    source === 'cheapshark'
      ? optionalNumber(value.originalPrice, 'originalPrice', 99_999_999.99)
      : undefined
  if (source === 'cheapshark' && submittedPrice === undefined) {
    throw new GamePersistenceError('Preço informativo do jogo inválido.', 400, 'INVALID_GAME')
  }

  const price = mockProduct ? mockProduct.priceCents / 100 : submittedPrice!
  const originalPrice = mockProduct
    ? mockProduct.originalPriceCents / 100
    : submittedOriginalPrice
  const effectiveOriginalPrice = originalPrice ?? price
  const discountPercentage = mockProduct
    ? effectiveOriginalPrice > price
      ? Math.round(((effectiveOriginalPrice - price) / effectiveOriginalPrice) * 100)
      : undefined
    : optionalNumber(value.discountPercentage, 'discountPercentage', 100)
  const rating = optionalNumber(value.rating, 'rating', 9.99)
  const releaseDate = parseReleaseDate(value.releaseDate)
  const isFeatured = optionalBoolean(value.isFeatured, 'isFeatured')
  const isOffer = optionalBoolean(value.isOffer, 'isOffer')

  if (
    value.description !== undefined &&
    value.description !== null &&
    (typeof value.description !== 'string' || value.description.length > 65535)
  ) {
    throw new GamePersistenceError('Descrição do jogo inválida.', 400, 'INVALID_GAME')
  }

  return {
    id,
    source,
    title: mockProduct?.title ?? submittedTitle,
    coverUrl,
    price,
    ...(originalPrice !== undefined ? { originalPrice } : {}),
    ...(discountPercentage !== undefined ? { discountPercentage } : {}),
    genre: stringArray(value.genre, 'genre'),
    platforms: stringArray(value.platforms, 'platforms'),
    ...(rating !== undefined ? { rating } : {}),
    ...(releaseDate ? { releaseDate } : {}),
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    ...(isFeatured !== undefined ? { isFeatured } : {}),
    isOffer: mockProduct
      ? effectiveOriginalPrice > price
      : isOffer ?? false,
  }
}

function parseJsonArray(value: unknown, field: string): string[] {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch (error) {
      throw new Error(`O campo ${field} contém JSON inválido no banco.`, { cause: error })
    }
  }

  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
    throw new Error(`O campo ${field} contém dados inválidos no banco.`)
  }

  return parsed
}

export function mapGameRow(row: GameRow): PersistedGame {
  const releaseDate =
    row.releaseDate instanceof Date
      ? row.releaseDate.toISOString().slice(0, 10)
      : row.releaseDate ?? undefined
  const originalPrice =
    row.originalPrice === null ? undefined : Number(row.originalPrice)
  const discountPercentage = row.discountPercentage ?? undefined
  const rating = row.rating === null ? undefined : Number(row.rating)
  const description = row.description ?? undefined

  return {
    id: row.id,
    source: row.source,
    title: row.title,
    coverUrl: row.coverUrl,
    price: Number(row.price),
    ...(originalPrice !== undefined ? { originalPrice } : {}),
    ...(discountPercentage !== undefined ? { discountPercentage } : {}),
    genre: parseJsonArray(row.genre, 'genre'),
    platforms: parseJsonArray(row.platforms, 'platforms'),
    ...(rating !== undefined ? { rating } : {}),
    ...(releaseDate ? { releaseDate } : {}),
    ...(description ? { description } : {}),
    isFeatured: Boolean(row.isFeatured),
    isOffer: Boolean(row.isOffer),
  }
}

const GAME_SELECT = `SELECT id AS databaseId, source, source_game_id AS id,
  title, cover_url AS coverUrl,
  price, original_price AS originalPrice, discount_percentage AS discountPercentage,
  genre, platforms, rating, release_date AS releaseDate, description,
  is_featured AS isFeatured, is_offer AS isOffer
  FROM games WHERE source = ? AND source_game_id = ? LIMIT 1`

export async function ensureGame(
  connection: PoolConnection,
  game: PersistedGameInput,
): Promise<{ id: string; game: PersistedGame }> {
  await connection.execute<ResultSetHeader>(
    `INSERT INTO games
      (source, source_game_id, title, cover_url, price, original_price,
       discount_percentage, genre, platforms, rating, release_date, description,
       is_featured, is_offer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), cover_url = VALUES(cover_url), price = VALUES(price),
       original_price = VALUES(original_price),
       discount_percentage = VALUES(discount_percentage), genre = VALUES(genre),
       platforms = VALUES(platforms), rating = VALUES(rating),
       release_date = VALUES(release_date), description = VALUES(description),
       is_featured = VALUES(is_featured), is_offer = VALUES(is_offer)`,
    [
      game.source,
      game.id,
      game.title,
      game.coverUrl,
      game.price,
      game.originalPrice ?? null,
      game.discountPercentage ?? null,
      JSON.stringify(game.genre),
      JSON.stringify(game.platforms),
      game.rating ?? null,
      game.releaseDate ?? null,
      game.description ?? null,
      game.isFeatured ?? false,
      game.isOffer ?? false,
    ],
  )
  const [rows] = await connection.execute<GameRow[]>(GAME_SELECT, [game.source, game.id])
  const row = rows[0]
  if (!row) {
    throw new Error('O jogo não foi encontrado após a gravação no catálogo.')
  }

  return { id: String(row.databaseId), game: mapGameRow(row) }
}

export async function findGame(
  connection: PoolConnection,
  source: GameSource,
  externalId: string,
): Promise<{ id: string; game: PersistedGame } | undefined> {
  const [rows] = await connection.execute<GameRow[]>(GAME_SELECT, [source, externalId])
  const row = rows[0]
  return row ? { id: String(row.databaseId), game: mapGameRow(row) } : undefined
}

export function parseGameSource(value: string): GameSource | undefined {
  return value === 'mock' || value === 'cheapshark' ? value : undefined
}

export function normalizeExternalId(value: string): string {
  if (!value.trim() || value.length > 150) {
    throw new GamePersistenceError('Identificador de jogo inválido.', 400, 'INVALID_GAME_ID')
  }

  return value.trim()
}
