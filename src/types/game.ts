/** Plataformas normalizadas usadas nos dados locais e filtros do catálogo. */
export type Platform = 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile'
export type GameSource = 'mock' | 'cheapshark'

/**
 * Representa um jogo da loja, independentemente de sua origem ser a API ou os dados locais.
 */
export interface Game {
  /** Identificador usado em rotas, carrinho e lista de favoritos. */
  id: string
  /** Origem usada para distinguir IDs locais de IDs da CheapShark. */
  source?: GameSource
  /** Nome exibido nos cards, detalhes e resumos do pedido. */
  title: string
  /** URL da imagem usada como capa e arte do jogo. */
  coverUrl: string
  /** Preço atual do jogo, em unidade monetária numérica. */
  price: number
  /** Percentual de desconto exibido quando o jogo está em oferta. */
  discountPercentage?: number
  /** Preço anterior à promoção, quando informado. */
  originalPrice?: number
  /** Categorias de gênero usadas na navegação e nos filtros. */
  genre: string[]
  /** Plataformas nas quais o jogo está disponível. */
  platforms: Platform[]
  /** Nota de avaliação opcional apresentada nos detalhes e na ordenação. */
  rating?: number
  /** Data de lançamento no formato textual esperado pela interface. */
  releaseDate?: string
  /** Texto descritivo apresentado na página de detalhes e no destaque. */
  description?: string
  /** Indica se o jogo deve aparecer como destaque. */
  isFeatured?: boolean
  /** Indica se o jogo deve aparecer na seleção de ofertas. */
  isOffer?: boolean
}
