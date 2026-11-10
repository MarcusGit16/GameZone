import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  Check,
  Gamepad2,
  Heart,
  Loader2,
  Monitor,
  PackageCheck,
  ShoppingBag,
  Star,
} from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { getGameById } from '../services/gameService'

import type { Game } from '../types/game'
import { formatPrice } from '../utils/currency'

import './GameDetails.css'

interface GameMedia {
  src: string
  label: string
  position: string
}

/** Monta a mídia da galeria a partir da capa e dos recursos disponíveis do jogo. */
function getGalleryMedia(game: Game): GameMedia[] {
  return [
    { src: game.coverUrl, label: 'Arte principal', position: 'center' },
    { src: game.coverUrl, label: 'Detalhe da arte', position: 'left center' },
    { src: game.coverUrl, label: 'Visão ampliada', position: 'right center' },
  ]
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Página de detalhes com galeria, preço e ações para o jogo selecionado. */
function GameDetails() {
  const { id } = useParams<{ id: string }>()
  const [addedFeedback, setAddedFeedback] = useState(0)
  const [activeMedia, setActiveMedia] = useState(0)
  const [loadedGame, setLoadedGame] = useState<{
    id: string | undefined
    game: Game | undefined
  } | null>(null)
  const { addToCart, isInCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const isLoading = loadedGame === null || loadedGame.id !== id
  const game = loadedGame && loadedGame.id === id ? loadedGame.game : undefined
  const isFavorited = game ? isFavorite(game) : false

  useEffect(() => {
    let isActive = true

    async function loadGame() {
      if (!id) {
        setLoadedGame({ id, game: undefined })
        return
      }

      try {
        const loadedGame = await getGameById(id)
        if (isActive) {
          setLoadedGame({ id, game: loadedGame })
        }
      } catch (error) {
        console.error(`Não foi possível carregar o jogo ${id}.`, error)
        if (isActive) {
          setLoadedGame({ id, game: undefined })
        }
      }
    }

    void loadGame()

    return () => {
      isActive = false
    }
  }, [id])

  useEffect(() => {
    if (addedFeedback === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => setAddedFeedback(0), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [addedFeedback])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (isLoading) {
    return (
      <section
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

  if (!game) {
    return (
      <section className="game-details-not-found" aria-labelledby="game-details-not-found-title">
        <span className="game-details-not-found__icon">
          <AlertCircle size={34} aria-hidden="true" />
        </span>
        <h1 id="game-details-not-found-title">Jogo não encontrado</h1>
        <p>Este jogo não está disponível ou o endereço informado é inválido.</p>
        <Link className="game-details__button game-details__button--primary" to="/catalogo">
          Voltar ao Catálogo
        </Link>
      </section>
    )
  }

  const selectedGame = game
  const galleryMedia = getGalleryMedia(game)
  const currentMedia = galleryMedia[activeMedia] ?? galleryMedia[0]
  const addButtonLabel =
    addedFeedback > 0
      ? 'Adicionado!'
      : isInCart(game)
        ? 'Adicionar mais uma unidade'
        : 'Adicionar ao Carrinho'
  const releaseDate = game.releaseDate
    ? dateFormatter.format(new Date(`${game.releaseDate}T00:00:00Z`))
    : 'Não informada'

  function handleSelectMedia(index: number) {
    setActiveMedia(index)
  }

  function handleAddToCart() {
    addToCart(selectedGame)
    setAddedFeedback((feedback) => feedback + 1)
  }

  function handleToggleFavorite() {
    toggleFavorite(selectedGame)
  }

  return (
    <div className="game-details">
      <div
        className="game-details__hero"
        style={{ backgroundImage: `url("${game.coverUrl.replace('w=900', 'w=1800')}")` }}
        aria-hidden="true"
      >
        <div className="game-details__hero-overlay" />
      </div>

      <div className="game-details__container">
        <nav className="game-details__breadcrumbs" aria-label="Trilha de navegação">
          <Link to="/">Início</Link>
          <span aria-hidden="true">&gt;</span>
          <Link to="/catalogo">Catálogo</Link>
          <span aria-hidden="true">&gt;</span>
          <span aria-current="page">{game.title}</span>
        </nav>

        <header className="game-details__heading">
          <h1>{game.title}</h1>
          <div className="game-details__genres" aria-label="Gêneros">
            {game.genre.map((genre) => (
              <span className="game-details__genre" key={genre}>
                {genre}
              </span>
            ))}
          </div>
        </header>

        <div className="game-details__layout">
          <div className="game-details__main">
            <section className="game-details__gallery" aria-label="Galeria de imagens">
              <div className="game-details__main-media">
                <img
                  src={currentMedia.src}
                  alt={`${game.title} — ${currentMedia.label}`}
                  style={{ objectPosition: currentMedia.position }}
                />
              </div>
              <div className="game-details__thumbnails" role="group" aria-label="Selecionar imagem">
                {galleryMedia.map((media, index) => (
                  <button
                    className={`game-details__thumbnail${index === activeMedia ? ' game-details__thumbnail--active' : ''}`}
                    key={media.label}
                    type="button"
                    aria-label={`Exibir ${media.label}`}
                    aria-pressed={index === activeMedia}
                    onClick={() => handleSelectMedia(index)}
                  >
                    <img
                      src={media.src}
                      alt=""
                      loading="lazy"
                      style={{ objectPosition: media.position }}
                    />
                  </button>
                ))}
              </div>
              <p className="game-details__gallery-note">
                Galeria demonstrativa usando a arte disponível para este jogo.
              </p>
            </section>

            <section className="game-details__section" aria-labelledby="game-about-title">
              <h2 id="game-about-title">Sobre este Jogo</h2>
              <p>
                {game.description ??
                  `${game.title} convida você a explorar um universo cheio de desafios e descobertas.`}
              </p>
              <p>
                Prepare-se para uma experiência feita para quem gosta de boas histórias,
                mundos marcantes e novas aventuras. Escolha sua plataforma e descubra tudo
                o que este jogo tem a oferecer.
              </p>
            </section>

            <section className="game-details__section" aria-labelledby="game-info-title">
              <h2 id="game-info-title">Informações Adicionais</h2>
              <dl className="game-details__info-grid">
                <div className="game-details__info-item">
                  <dt>Plataformas</dt>
                  <dd>
                    {game.platforms.map((platform) => (
                      <span className="game-details__platform" key={platform}>
                        {platform === 'PC' ? (
                          <Monitor size={15} aria-hidden="true" />
                        ) : (
                          <Gamepad2 size={15} aria-hidden="true" />
                        )}
                        {platform}
                      </span>
                    ))}
                  </dd>
                </div>
                <div className="game-details__info-item">
                  <dt>
                    <CalendarDays size={15} aria-hidden="true" />
                    Lançamento
                  </dt>
                  <dd>{releaseDate}</dd>
                </div>
                <div className="game-details__info-item">
                  <dt>Desenvolvedora</dt>
                  <dd>Não informada — projeto demonstrativo</dd>
                </div>
                <div className="game-details__info-item">
                  <dt>
                    <Star size={15} aria-hidden="true" />
                    Avaliação
                  </dt>
                  <dd>{game.rating !== undefined ? `${game.rating.toFixed(1)} / 5` : 'Sem avaliação'}</dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="game-details__buy-box" aria-label="Comprar jogo">
            <div className="game-details__buy-art">
              <img src={game.coverUrl} alt={`Arte de ${game.title}`} />
              <span>GameZone</span>
            </div>

            <h2>{game.title}</h2>

            <div className="game-details__price">
              {game.discountPercentage !== undefined && (
                <span className="game-details__discount">
                  -{game.discountPercentage}%
                </span>
              )}
              {game.originalPrice !== undefined && (
                <span className="game-details__original-price">
                  {formatPrice(game.originalPrice)}
                </span>
              )}
              <span className="game-details__current-price">
                {formatPrice(game.price)}
              </span>
            </div>

            <button
              className="game-details__button game-details__button--primary"
              type="button"
              aria-label={addedFeedback > 0
                ? `${game.title} adicionado ao carrinho`
                : `Adicionar ${game.title} ao carrinho`}
              onClick={handleAddToCart}
            >
              {addedFeedback > 0 ? (
                <Check size={19} aria-hidden="true" />
              ) : (
                <ShoppingBag size={19} aria-hidden="true" />
              )}
              {addButtonLabel}
            </button>
            <button
              className={`game-details__button game-details__button--secondary${isFavorited ? ' game-details__button--favorited' : ''}`}
              type="button"
              aria-pressed={isFavorited}
              aria-label={
                isFavorited
                  ? `Remover ${game.title} dos favoritos`
                  : `Adicionar ${game.title} aos favoritos`
              }
              onClick={handleToggleFavorite}
            >
              <Heart
                size={19}
                fill={isFavorited ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              {isFavorited ? 'Adicionado aos Favoritos' : 'Favoritar'}
            </button>

            <p className="game-details__digital-notice">
              <PackageCheck size={18} aria-hidden="true" />
              <span>Ativação Digital Instantânea — Projeto Demonstrativo Fictício</span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default GameDetails
