import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Heart, ShoppingBag, Trash2 } from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'

import type { Game } from '../types/game'
import { formatPrice } from '../utils/currency'

import './Favorites.css'

/** Exibe a lista de desejos e permite remover ou acessar jogos salvos. */
function Favorites() {
  const { favorites, toggleFavorite, totalFavorites, isLoading } = useFavorites()
  const { addToCart } = useCart()
  const [addedGameId, setAddedGameId] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!addedGameId) {
      return
    }

    const timeoutId = window.setTimeout(() => setAddedGameId(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [addedGameId])

  function handleClearFavorites() {
    favorites.forEach((game) => toggleFavorite(game))
    setAddedGameId(null)
  }

  function handleToggleFavorite(game: Game) {
    toggleFavorite(game)
  }

  function handleAddToCart(game: Game) {
    addToCart(game)
    setAddedGameId(game.id)
  }

  if (favorites.length === 0) {
    if (isLoading) {
      return (
        <section className="favorites-empty" role="status" aria-live="polite">
          <p>Carregando seus favoritos...</p>
        </section>
      )
    }

    return (
      <section className="favorites-empty">
        <span className="favorites-empty__icon">
          <Heart size={35} aria-hidden="true" />
        </span>
        <h1>Sua lista de favoritos está vazia</h1>
        <p>
          Você ainda não adicionou nenhum jogo aos seus favoritos. Explore nosso catálogo e
          guarde seus jogos preferidos aqui!
        </p>
        <Link className="favorites-empty__explore" to="/catalogo">
          Explorar Catálogo de Jogos
        </Link>
      </section>
    )
  }

  return (
    <div className="favorites-page">
      <header className="favorites-page__header">
        <div>
          <span className="favorites-page__eyebrow">Sua coleção pessoal</span>
          <h1>Meus Favoritos</h1>
          <p>
            <strong>{totalFavorites}</strong>{' '}
            {totalFavorites === 1 ? 'jogo salvo' : 'jogos salvos'} para você.
          </p>
        </div>
        <button
          className="favorites-page__clear"
          type="button"
          onClick={handleClearFavorites}
        >
          <Trash2 size={17} aria-hidden="true" />
          Limpar Favoritos
        </button>
      </header>

      <div className="favorites-grid" aria-label="Jogos favoritos">
        {favorites.map((game) => {
          const isAdded = addedGameId === game.id

          return (
            <article className="favorite-card" key={`${game.source}:${game.id}`}>
              <Link
                className="favorite-card__details"
                to={`/jogo/${game.id}`}
                aria-label={`Ver detalhes de ${game.title}`}
              >
                <div className="favorite-card__cover">
                  <img src={game.coverUrl} alt={`Capa de ${game.title}`} loading="lazy" />
                  {game.discountPercentage !== undefined && (
                    <span className="favorite-card__discount">
                      -{game.discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="favorite-card__content">
                  <h2>{game.title}</h2>
                  <p>{game.genre.join(' · ')}</p>
                  <div className="favorite-card__platforms" aria-label="Plataformas">
                    {game.platforms.map((platform) => (
                      <span key={platform}>{platform}</span>
                    ))}
                  </div>
                </div>
              </Link>

              <div className="favorite-card__footer">
                <div className="favorite-card__price">
                  {game.originalPrice !== undefined && (
                    <span className="favorite-card__original-price">
                      {formatPrice(game.originalPrice)}
                    </span>
                  )}
                  <strong>{formatPrice(game.price)}</strong>
                </div>
                <button
                  className="favorite-card__remove"
                  type="button"
                  aria-label={`Remover ${game.title} dos favoritos`}
                  onClick={() => handleToggleFavorite(game)}
                >
                  <Heart size={19} fill="currentColor" aria-hidden="true" />
                </button>
              </div>

              <button
                className={`favorite-card__add${isAdded ? ' favorite-card__add--success' : ''}`}
                type="button"
                aria-label={
                  isAdded
                    ? `${game.title} adicionado ao carrinho`
                    : `Adicionar ${game.title} ao carrinho`
                }
                onClick={() => handleAddToCart(game)}
              >
                {isAdded ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <ShoppingBag size={17} aria-hidden="true" />
                )}
                {isAdded ? 'Adicionado!' : 'Adicionar ao Carrinho'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default Favorites
