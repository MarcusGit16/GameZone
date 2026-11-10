import axios from 'axios'

import { backendApi } from './backendApi'
import { withGameSource } from './gameSource'
import type { CartItem } from '../types/cart'
import type { Game } from '../types/game'

interface CartResponse {
  items: CartItem[]
}

function normalizeItems(items: CartItem[]): CartItem[] {
  return items.map(({ game, quantity }) => ({
    game: withGameSource(game),
    quantity,
  }))
}

export async function getCart(): Promise<CartItem[]> {
  const response = await backendApi.get<CartResponse>('/cart')
  return normalizeItems(response.data.items)
}

export async function addCartItem(game: Game): Promise<CartItem[]> {
  const response = await backendApi.post<CartResponse>('/cart/items', {
    game: withGameSource(game),
  })
  return normalizeItems(response.data.items)
}

export async function updateCartItem(
  game: Game,
  quantity: number,
): Promise<CartItem[]> {
  const identity = withGameSource(game)
  const path = `/cart/items/${identity.source}/${encodeURIComponent(identity.id)}`
  const response =
    quantity < 1
      ? await backendApi.delete<CartResponse>(path)
      : await backendApi.patch<CartResponse>(path, { quantity })
  return normalizeItems(response.data.items)
}

export async function removeCartItem(game: Game): Promise<CartItem[]> {
  const identity = withGameSource(game)
  const response = await backendApi.delete<CartResponse>(
    `/cart/items/${identity.source}/${encodeURIComponent(identity.id)}`,
  )
  return normalizeItems(response.data.items)
}

export async function clearCart(): Promise<CartItem[]> {
  const response = await backendApi.delete<CartResponse>('/cart')
  return normalizeItems(response.data.items)
}

export function getCartErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor para sincronizar o carrinho.'
    }
  }

  return 'Não foi possível sincronizar o carrinho.'
}
