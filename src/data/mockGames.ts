import type { Game } from '../types/game'

/**
 * Massa local de jogos para desenvolvimento e demonstração.
 * Também serve como fallback para manter as telas navegáveis quando a API falha.
 */
export const MOCK_GAMES: Game[] = [
  {
    id: 'neon-frontier',
    title: 'Neon Frontier',
    coverUrl:
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=85',
    price: 89.9,
    originalPrice: 179.9,
    discountPercentage: 50,
    genre: ['Ação', 'Ficção científica'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    rating: 4.8,
    releaseDate: '2025-02-14',
    description:
      'Explore uma metrópole futurista, forme sua equipe e descubra o que existe além da última fronteira.',
    isFeatured: true,
    isOffer: true,
  },
  {
    id: 'ashes-of-elyria',
    title: 'Ashes of Elyria',
    coverUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85',
    price: 119.9,
    originalPrice: 199.9,
    discountPercentage: 40,
    genre: ['RPG', 'Aventura'],
    platforms: ['PC', 'PlayStation'],
    rating: 4.9,
    releaseDate: '2024-10-22',
    description:
      'Uma jornada épica por reinos esquecidos, onde cada escolha muda o destino de Elyria.',
    isFeatured: true,
    isOffer: true,
  },
  {
    id: 'iron-tactics',
    title: 'Iron Tactics',
    coverUrl:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=85',
    price: 59.9,
    originalPrice: 99.9,
    discountPercentage: 40,
    genre: ['Estratégia', 'Simulação'],
    platforms: ['PC', 'Mobile'],
    rating: 4.6,
    releaseDate: '2025-01-08',
    description:
      'Comande suas tropas em campanhas táticas e conquiste territórios em um mundo em guerra.',
    isOffer: true,
  },
  {
    id: 'wildwood-chronicles',
    title: 'Wildwood Chronicles',
    coverUrl:
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85',
    price: 74.9,
    originalPrice: 149.9,
    discountPercentage: 50,
    genre: ['Aventura', 'Exploração'],
    platforms: ['PC', 'Xbox', 'Nintendo'],
    rating: 4.7,
    releaseDate: '2024-08-16',
    description:
      'Atravesse florestas ancestrais e revele os segredos de uma natureza indomável.',
    isOffer: true,
  },
  {
    id: 'echoes-of-the-deep',
    title: 'Echoes of the Deep',
    coverUrl:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85',
    price: 149.9,
    genre: ['Aventura', 'Exploração'],
    platforms: ['PC', 'PlayStation'],
    rating: 4.8,
    releaseDate: '2025-05-30',
    description:
      'Desça às profundezas de um oceano misterioso e descubra uma civilização perdida.',
    isFeatured: true,
  },
  {
    id: 'pixel-racers',
    title: 'Pixel Racers',
    coverUrl:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85',
    price: 99.9,
    genre: ['Corrida', 'Arcade'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    rating: 4.5,
    releaseDate: '2025-03-12',
    description:
      'Dispute corridas eletrizantes em pistas vibrantes e personalize sua máquina.',
    isFeatured: true,
  },
  {
    id: 'last-light-protocol',
    title: 'Last Light Protocol',
    coverUrl:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85',
    price: 129.9,
    genre: ['Ação', 'Sobrevivência'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Mobile'],
    rating: 4.7,
    releaseDate: '2025-04-04',
    description:
      'Sobreviva ao apagão que transformou a cidade e encontre uma saída antes do amanhecer.',
    isFeatured: true,
  },
  {
    id: 'clockwork-kingdom',
    title: 'Clockwork Kingdom',
    coverUrl:
      'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=900&q=85',
    price: 84.9,
    genre: ['RPG', 'Estratégia'],
    platforms: ['PC'],
    rating: 4.6,
    releaseDate: '2024-11-19',
    description:
      'Construa um reino movido a engrenagens e lidere seus habitantes em uma nova era.',
  },
]
