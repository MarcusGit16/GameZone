import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Gamepad2, Heart, Monitor, ShoppingBag } from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'

import type { Game } from '../types/game'
import { formatPrice } from '../utils/currency'

import './GameCard.css'

/** Dados necessários para renderizar um card individual de jogo. */
interface GameCardProps {
  game: Game
}

/** Exibe capa, preço, plataformas e ações de carrinho e favoritos de um jogo. */
function GameCard({ game }: GameCardProps) {
  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [addedFeedback, setAddedFeedback] = useState(0)
  const isFavorited = isFavorite(game)

  useEffect(() => {
    if (addedFeedback === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => setAddedFeedback(0), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [addedFeedback])

  function handleAddToCart() {
    addToCart(game)
    setAddedFeedback((feedback) => feedback + 1)
  }

  function handleToggleFavorite() {
    toggleFavorite(game)
  }

  return (
    <article className="game-card">
      <Link
        className="game-card__details"
        to={`/jogo/${game.id}`}
        aria-label={`Ver detalhes de ${game.title}`}
      >
        <div className="game-card__cover">
          <img src={game.coverUrl} alt={`Capa de ${game.title}`} loading="lazy" />
          {game.discountPercentage !== undefined && (
            <span className="game-card__discount">-{game.discountPercentage}%</span>
          )}
        </div>
        <div className="game-card__content">
          <div className="game-card__platforms" aria-label="Plataformas disponíveis">
            {game.platforms.map((platform) => (
              <span className="game-card__platform" key={platform}>
                {platform === 'PC' ? (
                  <Monitor size={13} aria-hidden="true" />
                ) : (
                  <Gamepad2 size={13} aria-hidden="true" />
                )}
                {platform}
              </span>
            ))}
          </div>
          <h3 className="game-card__title">{game.title}</h3>
          <p className="game-card__genres">{game.genre.join(' · ')}</p>
        </div>
      </Link>

      <div className="game-card__footer">
        <div className="game-card__price">
          {game.originalPrice !== undefined && (
            <span className="game-card__original-price">
              {formatPrice(game.originalPrice)}
            </span>
          )}
          <span className="game-card__current-price">
            {formatPrice(game.price)}
          </span>
        </div>
        <button
          className="game-card__add-to-cart"
          type="button"
          aria-label={
            addedFeedback > 0
              ? `${game.title} adicionado ao carrinho`
              : `Adicionar ${game.title} ao carrinho`
          }
          title={addedFeedback > 0 ? 'Adicionado!' : 'Adicionar ao carrinho'}
          onClick={handleAddToCart}
          style={{
            display: 'inline-flex',
            minHeight: 38,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '0 9px',
            border: '1px solid var(--color-primary)',
            borderRadius: 8,
            color: 'var(--game-card-add-to-cart-text, var(--color-text))',
            backgroundColor: 'var(--color-primary)',
            fontSize: 12,
          }}
        >
          {addedFeedback > 0 ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <ShoppingBag size={16} aria-hidden="true" />
          )}
          {addedFeedback > 0 ? 'Adicionado!' : 'Adicionar'}
        </button>
        <button
          className={`game-card__favorite${isFavorited ? ' game-card__favorite--active' : ''}`}
          type="button"
          aria-label={
            isFavorited
              ? `Remover ${game.title} dos favoritos`
              : `Adicionar ${game.title} aos favoritos`
          }
          aria-pressed={isFavorited}
          onClick={handleToggleFavorite}
        >
          <Heart size={19} fill={isFavorited ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export default GameCard
