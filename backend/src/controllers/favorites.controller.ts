import type { Request, Response } from 'express'
import {
  addFavorite,
  FavoritesError,
  getFavorites,
  removeFavorite,
} from '../services/favorites.service.js'
import { GamePersistenceError } from '../services/games.service.js'

function sendError(error: unknown, response: Response): void {
  if (error instanceof FavoritesError || error instanceof GamePersistenceError) {
    response.status(error.statusCode).json({ code: error.code, message: error.message })
    return
  }

  console.error('Não foi possível atualizar os favoritos.', error)
  response.status(500).json({
    code: 'FAVORITES_OPERATION_FAILED',
    message: 'Não foi possível atualizar os favoritos. Tente novamente.',
  })
}

function getUserId(request: Request, response: Response): string | undefined {
  const userId = request.session.userId
  if (!userId) {
    response.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    })
    return undefined
  }

  return userId
}

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export async function list(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({ favorites: await getFavorites(userId) })
  } catch (error) {
    sendError(error, response)
  }
}

export async function add(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({
      favorites: await addFavorite(userId, request.body),
    })
  } catch (error) {
    sendError(error, response)
  }
}

export async function remove(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({
      favorites: await removeFavorite(
        userId,
        getRouteParam(request.params.source),
        getRouteParam(request.params.gameId),
      ),
    })
  } catch (error) {
    sendError(error, response)
  }
}
