import { useEffect, useState } from 'react'
import { SearchX } from 'lucide-react'

import GameCard from '../components/GameCard'
import { getGames } from '../services/gameService'

import type { Game } from '../types/game'

import './Deals.css'

/** Lista as ofertas carregadas pelo serviço com estados de carregamento e vazio. */
function Deals() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadGames() {
      try {
        const loadedGames = await getGames()
        if (isActive) {
          setGames(loadedGames.filter((game) => game.isOffer))
        }
      } catch (error) {
        console.error('Não foi possível carregar as ofertas.', error)
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
      <section className="deals-page deals-page__status" role="status" aria-live="polite">
        <span className="deals-page__spinner" aria-hidden="true" />
        <span>Carregando ofertas...</span>
      </section>
    )
  }

  return (
    <div className="deals-page">
      <header className="deals-page__heading">
        <span className="deals-page__eyebrow">Preços especiais</span>
        <h1>Ofertas Imperdíveis</h1>
        <p>Encontre sua próxima aventura com desconto.</p>
      </header>

      {games.length > 0 ? (
        <div className="deals-page__grid" aria-label="Jogos em oferta">
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      ) : (
        <section className="deals-page__empty" aria-live="polite">
          <SearchX size={32} aria-hidden="true" />
          <h2>Nenhuma oferta disponível</h2>
          <p>Volte em breve para conferir novas promoções.</p>
        </section>
      )}
    </div>
  )
}

export default Deals
