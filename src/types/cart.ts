import type { Game } from './game'

/**
 * Item mantido no carrinho, associando os dados do jogo à quantidade selecionada.
 */
export interface CartItem {
  /** Dados completos usados para renderizar e calcular o item. */
  game: Game
  /** Número de unidades do jogo no carrinho. */
  quantity: number
}
