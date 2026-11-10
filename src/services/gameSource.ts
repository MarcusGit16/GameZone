import { MOCK_GAMES } from '../data/mockGames'
import type { Game, GameSource } from '../types/game'

export function getGameSource(game: Game): GameSource {
  return (
    game.source ??
    (MOCK_GAMES.some((mockGame) => mockGame.id === game.id) ? 'mock' : 'cheapshark')
  )
}

export function hasSameGameIdentity(first: Game, second: Game): boolean {
  return first.id === second.id && getGameSource(first) === getGameSource(second)
}

export function withGameSource(game: Game): Game {
  return { ...game, source: getGameSource(game) }
}
