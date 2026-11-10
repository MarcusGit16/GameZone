import axios from 'axios'

import { backendApi } from './backendApi'
import { withGameSource } from './gameSource'
import type { Game } from '../types/game'

interface FavoritesResponse {
  favorites: Game[]
}

function normalizeFavorites(favorites: Game[]): Game[] {
  return favorites.map(withGameSource)
}

export async function getFavorites(): Promise<Game[]> {
  const response = await backendApi.get<FavoritesResponse>('/favorites')
  return normalizeFavorites(response.data.favorites)
}

export async function addFavorite(game: Game): Promise<Game[]> {
  const response = await backendApi.post<FavoritesResponse>('/favorites', {
    game: withGameSource(game),
  })
  return normalizeFavorites(response.data.favorites)
}

export async function removeFavorite(game: Game): Promise<Game[]> {
  const identity = withGameSource(game)
  const response = await backendApi.delete<FavoritesResponse>(
    `/favorites/${identity.source}/${encodeURIComponent(identity.id)}`,
  )
  return normalizeFavorites(response.data.favorites)
}

export function getFavoritesErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor para sincronizar os favoritos.'
    }
  }

  return 'Não foi possível sincronizar os favoritos.'
}
