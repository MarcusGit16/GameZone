export interface MockOrderProduct {
  id: string
  title: string
  priceCents: number
  originalPriceCents: number
}

// Keep these server-authoritative BRL prices aligned with the frontend demo catalog.
export const MOCK_ORDER_CATALOG: MockOrderProduct[] = [
  {
    id: 'neon-frontier',
    title: 'Neon Frontier',
    priceCents: 8990,
    originalPriceCents: 17990,
  },
  {
    id: 'ashes-of-elyria',
    title: 'Ashes of Elyria',
    priceCents: 11990,
    originalPriceCents: 19990,
  },
  {
    id: 'iron-tactics',
    title: 'Iron Tactics',
    priceCents: 5990,
    originalPriceCents: 9990,
  },
  {
    id: 'wildwood-chronicles',
    title: 'Wildwood Chronicles',
    priceCents: 7490,
    originalPriceCents: 14990,
  },
  {
    id: 'echoes-of-the-deep',
    title: 'Echoes of the Deep',
    priceCents: 14990,
    originalPriceCents: 14990,
  },
  {
    id: 'pixel-racers',
    title: 'Pixel Racers',
    priceCents: 9990,
    originalPriceCents: 9990,
  },
  {
    id: 'last-light-protocol',
    title: 'Last Light Protocol',
    priceCents: 12990,
    originalPriceCents: 12990,
  },
  {
    id: 'clockwork-kingdom',
    title: 'Clockwork Kingdom',
    priceCents: 8490,
    originalPriceCents: 8490,
  },
]
