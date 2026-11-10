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

interface FavoriteRow extends RowDataPacket {
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

export class FavoritesError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'FavoritesError'
  }
}

function validateUserId(userId: string): void {
  if (!/^\d{1,20}$/.test(userId)) {
    throw new FavoritesError('Sessão de usuário inválida.', 401, 'INVALID_SESSION')
  }
}

function parseIdentity(sourceValue: string, idValue: string): {
  source: GameSource
  id: string
} {
  const source = parseGameSource(sourceValue)
  if (!source) {
    throw new FavoritesError('Origem do jogo inválida.', 400, 'INVALID_GAME_SOURCE')
  }

  try {
    return { source, id: normalizeExternalId(idValue) }
  } catch (error) {
    if (error instanceof GamePersistenceError) {
      throw new FavoritesError(error.message, error.statusCode, error.code)
    }
    throw error
  }
}

const FAVORITES_SELECT = `SELECT g.source, g.source_game_id AS id, g.title,
  g.cover_url AS coverUrl, g.price, g.original_price AS originalPrice,
  g.discount_percentage AS discountPercentage, g.genre, g.platforms, g.rating,
  g.release_date AS releaseDate, g.description, g.is_featured AS isFeatured,
  g.is_offer AS isOffer
  FROM favorites f INNER JOIN games g ON g.id = f.game_id
  WHERE f.user_id = ? ORDER BY f.created_at DESC`

export async function getFavorites(userId: string): Promise<PersistedGame[]> {
  validateUserId(userId)
  const [rows] = await getDatabasePool().execute<FavoriteRow[]>(FAVORITES_SELECT, [userId])
  return rows.map(mapGameRow)
}

export async function addFavorite(
  userId: string,
  input: unknown,
): Promise<PersistedGame[]> {
  validateUserId(userId)
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new FavoritesError('Dados do jogo inválidos.', 400, 'INVALID_GAME')
  }

  const game = parsePersistedGame((input as Record<string, unknown>).game)
  const connection = await getDatabasePool().getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    const storedGame = await ensureGame(connection, game)
    await connection.execute<ResultSetHeader>(
      'INSERT IGNORE INTO favorites (user_id, game_id) VALUES (?, ?)',
      [userId, storedGame.id],
    )
    await connection.commit()
    transactionStarted = false
    return getFavorites(userId)
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Não foi possível reverter a alteração dos favoritos.', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function removeFavorite(
  userId: string,
  sourceValue: string,
  idValue: string,
): Promise<PersistedGame[]> {
  validateUserId(userId)
  const { source, id } = parseIdentity(sourceValue, idValue)
  const connection = await getDatabasePool().getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    const game = await findGame(connection, source, id)
    if (game) {
      await connection.execute<ResultSetHeader>(
        'DELETE FROM favorites WHERE user_id = ? AND game_id = ?',
        [userId, game.id],
      )
    }
    await connection.commit()
    transactionStarted = false
    return getFavorites(userId)
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Não foi possível reverter a alteração dos favoritos.', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}
