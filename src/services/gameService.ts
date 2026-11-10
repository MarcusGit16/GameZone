import { AxiosError } from 'axios'

import { api } from './api'

import type { Game } from '../types/game'
import { MOCK_GAMES } from '../data/mockGames'

/** Campos do endpoint de ofertas usados na conversão para o modelo interno. */
interface CheapSharkDeal {
  gameID: string
  dealID: string
  title: string
  salePrice: string
  normalPrice: string
  thumb: string
}

/** Representação do jogo e dos preços retornados pelo endpoint de detalhes. */
interface CheapSharkGameDeal {
  dealID: string
  price: string
  retailPrice: string
}

/** Formato do endpoint CheapShark usado na consulta individual de jogos. */
interface CheapSharkGame {
  info: {
    title: string
    thumb: string
  }
  deals: CheapSharkGameDeal[]
}

/** Página de jogos da API e metadados de paginação, quando fornecidos. */
export interface GamesPage {
  games: Game[]
  totalCount: number | undefined
  hasMore: boolean
}

/** Converte preços textuais da API em números não negativos válidos. */
function parsePrice(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined
}

/** Converte uma oferta CheapShark e enriquece gênero e metadados da vitrine. */
function mapDealToGame(deal: CheapSharkDeal, index = 0): Game | undefined {
  const price = parsePrice(deal.salePrice)
  const originalPrice = parsePrice(deal.normalPrice)

  if (
    !deal.gameID ||
    !deal.title.trim() ||
    !deal.thumb ||
    price === undefined ||
    originalPrice === undefined
  ) {
    return undefined
  }

  const discountPercentage =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

  return {
    id: deal.gameID,
    source: 'cheapshark',
    title: deal.title,
    coverUrl: deal.thumb,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    discountPercentage,
    genre: [
      'Não classificado',
      ...(discountPercentage !== undefined ? ['Ofertas'] : []),
    ],
    platforms: ['PC'],
    isOffer: discountPercentage !== undefined,
    isFeatured: index < 8,
  }
}

/** Normaliza um header de contagem, rejeitando valores inválidos. */
function parseResponseCount(value: unknown): number | undefined {
  const parsedValue = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : undefined
}

/** Mescla duas listas por título normalizado, priorizando a lista primária. */
function mergeGamesByTitle(primaryGames: Game[], secondaryGames: Game[]): Game[] {
  const gamesByTitle = new Map<string, Game>()
  for (const game of [...primaryGames, ...secondaryGames]) {
    const normalizedTitle = game.title.trim().toLocaleLowerCase('pt-BR')
    if (!gamesByTitle.has(normalizedTitle)) {
      gamesByTitle.set(normalizedTitle, game)
    }
  }
  return Array.from(gamesByTitle.values())
}

/** Procura um jogo conhecido na base local de demonstração. */
function fallbackGame(id: string): Game | undefined {
  return MOCK_GAMES.find((game) => game.id === id)
}

/** Busca uma página de ofertas e lê os metadados de paginação expostos pela API. */
export async function getGamesPage(
  pageNumber = 0,
  pageSize = 20,
): Promise<GamesPage> {
  try {
    const response = await api.get<CheapSharkDeal[]>('/deals', {
      params: { storeID: 1, pageNumber, pageSize },
    })

    const gamesByTitle = new Map<string, Game>()
    response.data.forEach((deal, index) => {
      const game = mapDealToGame(deal, index)
      const normalizedTitle = game?.title.trim().toLocaleLowerCase('pt-BR')
      if (game && normalizedTitle && !gamesByTitle.has(normalizedTitle)) {
        gamesByTitle.set(normalizedTitle, game)
      }
    })

    const totalCountHeader = parseResponseCount(response.headers['x-total-count'])
    const totalPageCount = parseResponseCount(response.headers['x-total-page-count'])
    const totalCount = totalCountHeader
    const hasMore =
      totalPageCount !== undefined
        ? pageNumber + 1 < totalPageCount
        : totalCount !== undefined
          ? (pageNumber + 1) * pageSize < totalCount
          : response.data.length === pageSize

    return {
      games: Array.from(gamesByTitle.values()),
      totalCount,
      hasMore,
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(`Não foi possível carregar a página ${pageNumber + 1} da CheapShark.`, error)
    } else {
      console.error(`Erro inesperado ao carregar a página ${pageNumber + 1} da CheapShark.`, error)
    }

    if (pageNumber === 0) {
      console.warn('A CheapShark não retornou ofertas válidas; usando dados locais.')
      return { games: MOCK_GAMES, totalCount: undefined, hasMore: false }
    }

    throw error
  }
}

/** Carrega a primeira coleção de ofertas e combina com jogos locais sem duplicatas. */
export async function getGames(): Promise<Game[]> {
  const firstPage = await getGamesPage(0, 60)
  return mergeGamesByTitle(firstPage.games, MOCK_GAMES)
}

/** Busca detalhes de um jogo, preferindo mocks conhecidos e usando API como fallback. */
export async function getGameById(id: string): Promise<Game | undefined> {
  const localGame = fallbackGame(id)
  if (localGame) {
    return localGame
  }

  try {
    const response = await api.get<CheapSharkGame>('/games', {
      params: { id },
    })
    const apiGame = response.data
    const bestDeal = apiGame.deals.reduce<CheapSharkGameDeal | undefined>(
      (currentBest, deal) =>
        !currentBest || Number(deal.price) < Number(currentBest.price) ? deal : currentBest,
      undefined,
    )
    const price = parsePrice(bestDeal?.price)
    const originalPrice = parsePrice(bestDeal?.retailPrice)

    if (
      apiGame.info.title &&
      apiGame.info.thumb &&
      price !== undefined &&
      originalPrice !== undefined
    ) {
      const discountPercentage =
        originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : undefined

      return {
        id,
        source: 'cheapshark',
        title: apiGame.info.title,
        coverUrl: apiGame.info.thumb,
        price,
        originalPrice: originalPrice > price ? originalPrice : undefined,
        discountPercentage,
        genre: [
          'Não classificado',
          ...(originalPrice > price ? ['Ofertas'] : []),
        ],
        platforms: ['PC'],
        isOffer: originalPrice > price,
      }
    }

    return fallbackGame(id)
  } catch (error) {
    // Se a consulta remota falhar, um jogo local conhecido continua acessível.
    if (error instanceof AxiosError) {
      console.error(`Não foi possível carregar o jogo ${id}; consultando dados locais.`, error)
    } else {
      console.error(`Erro inesperado ao carregar o jogo ${id}; consultando dados locais.`, error)
    }

    return fallbackGame(id)
  }
}
