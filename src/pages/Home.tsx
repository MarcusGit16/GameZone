import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, Loader2, Swords, WandSparkles, Workflow } from 'lucide-react'

import GameCard from '../components/GameCard'
import HeroBanner from '../components/HeroBanner'
import { getGames } from '../services/gameService'

import type { Game } from '../types/game'

import './Home.css'

const categories = [
  { name: 'Ação', query: 'acao', Icon: Swords },
  { name: 'RPG', query: 'rpg', Icon: WandSparkles },
  { name: 'Estratégia', query: 'estrategia', Icon: Workflow },
  { name: 'Aventura', query: 'aventura', Icon: Compass },
]

/** Página inicial com banner, ofertas, destaques e atalhos de categoria. */
function Home() {
  const { pathname } = useLocation()
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    let isActive = true

    async function loadGames() {
      try {
        const loadedGames = await getGames()
        if (isActive) {
          setGames(loadedGames)
        }
      } catch (error) {
        console.error('Não foi possível carregar os jogos da página inicial.', error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadGames()

    return () => {
      isActive = false
    }
  }, [])

  if (isLoading) {
    return (
      <section
        className="home-page"
        role="status"
        aria-live="polite"
        style={{
          display: 'grid',
          minHeight: 320,
          placeItems: 'center',
          color: 'var(--color-highlight)',
        }}
      >
        <style>
          {'@keyframes gamezone-loader-spin { to { transform: rotate(360deg); } }'}
        </style>
        <span style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
          <Loader2
            size={32}
            aria-hidden="true"
            style={{ animation: 'gamezone-loader-spin 1s linear infinite' }}
          />
          <span>Carregando jogos...</span>
        </span>
      </section>
    )
  }

  const offers = games.filter((game) => game.isOffer)
  const featuredGames = games.filter((game) => game.isFeatured)

  return (
    <div className="home-page">
      <HeroBanner games={games} />

      <section className="home-page__section" aria-labelledby="home-offers-title">
        <div className="home-page__section-heading">
          <div>
            <h2 id="home-offers-title">Ofertas Imperdíveis</h2>
            <p>Grandes aventuras com preços especiais.</p>
          </div>
          <Link className="home-page__section-link" to="/ofertas">
            Ver todas
          </Link>
        </div>
        <div className="home-page__game-grid">
          {offers.slice(0, 6).map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      </section>

      <section className="home-page__section" aria-labelledby="home-featured-title">
        <div className="home-page__section-heading">
          <div>
            <h2 id="home-featured-title">Destaques da GameZone</h2>
            <p>Descubra os jogos que estão em alta.</p>
          </div>
          <Link className="home-page__section-link" to="/catalogo">
            Explorar catálogo
          </Link>
        </div>
        <div className="home-page__game-grid">
          {featuredGames.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      </section>

      <section className="home-page__section" aria-labelledby="home-categories-title">
        <div className="home-page__section-heading">
          <div>
            <h2 id="home-categories-title">Navegue por Categorias</h2>
            <p>Encontre sua próxima aventura pelo seu estilo favorito.</p>
          </div>
        </div>
        <div className="home-page__category-grid">
          {categories.map(({ name, query, Icon }) => (
            <Link
              className="home-page__category"
              key={query}
              to={`/catalogo?genero=${query}`}
            >
              <Icon className="home-page__category-icon" size={30} aria-hidden="true" />
              <span className="home-page__category-name">{name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
