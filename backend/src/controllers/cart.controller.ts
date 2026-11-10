import type { Request, Response } from 'express'
import {
  addCartItem,
  CartError,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service.js'
import { GamePersistenceError } from '../services/games.service.js'

function sendError(error: unknown, response: Response): void {
  if (error instanceof CartError || error instanceof GamePersistenceError) {
    response.status(error.statusCode).json({ code: error.code, message: error.message })
    return
  }

  console.error('Não foi possível atualizar o carrinho.', error)
  response.status(500).json({
    code: 'CART_OPERATION_FAILED',
    message: 'Não foi possível atualizar o carrinho. Tente novamente.',
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
    response.status(200).json({ items: await getCart(userId) })
  } catch (error) {
    sendError(error, response)
  }
}

export async function add(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({ items: await addCartItem(userId, request.body) })
  } catch (error) {
    sendError(error, response)
  }
}

export async function update(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({
      items: await updateCartItem(
        userId,
        getRouteParam(request.params.source),
        getRouteParam(request.params.gameId),
        request.body?.quantity,
      ),
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
      items: await removeCartItem(
        userId,
        getRouteParam(request.params.source),
        getRouteParam(request.params.gameId),
      ),
    })
  } catch (error) {
    sendError(error, response)
  }
}

export async function empty(request: Request, response: Response): Promise<void> {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    response.status(200).json({ items: await clearCart(userId) })
  } catch (error) {
    sendError(error, response)
  }
}
