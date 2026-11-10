import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Gamepad2,
  Heart,
  LogOut,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useTheme } from '../context/ThemeContext'
import { getAuthErrorMessage } from '../services/authService'
import { getGames } from '../services/gameService'

import type { Game } from '../types/game'
import { formatPrice } from '../utils/currency'

import './Header.css'

const badgeStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  display: 'flex',
  minWidth: 17,
  height: 17,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  transform: 'translate(30%, -25%)',
  border: '2px solid var(--color-background-secondary)',
  borderRadius: 999,
  color: 'var(--color-text)',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
} as const

/** Indicador compacto da quantidade de itens no carrinho ou favoritos. */
function CountBadge({ count, kind }: { count: number; kind: 'cart' | 'favorites' }) {
  if (count === 0) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...badgeStyle,
        backgroundColor: kind === 'cart' ? 'var(--color-primary)' : 'var(--color-promotion)',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'claro' : 'escuro'

  return (
    <button
      className="site-header__icon-button"
      type="button"
      aria-label={`Ativar tema ${nextTheme}`}
      title={`Ativar tema ${nextTheme}`}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  )
}

/** Navegação principal, ações da conta e autocomplete de jogos do catálogo. */
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Game[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchQueryRef = useRef('')
  const { totalItems } = useCart()
  const { user, status: authStatus, logout } = useAuth()
  const { totalFavorites } = useFavorites()
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    let isActive = true

    // Carrega os títulos disponíveis e atualiza sugestões caso já haja uma busca ativa.
    async function loadSearchGames() {
      try {
        const games = await getGames()
        if (isActive) {
          setAvailableGames(games)
          const query = searchQueryRef.current.trim().toLocaleLowerCase('pt-BR')
          if (query) {
            setSuggestions(
              games
                .filter((game) => game.title.toLocaleLowerCase('pt-BR').includes(query))
                .slice(0, 6),
            )
          }
        }
      } catch (error) {
        console.error('Não foi possível carregar jogos para a busca do cabeçalho.', error)
      }
    }

    void loadSearchGames()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    // Fecha e limpa as sugestões ao clicar fora da busca ou pressionar Escape.
    function handleOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !searchContainerRef.current?.contains(event.target)
      ) {
        searchQueryRef.current = ''
        setSearchQuery('')
        setSuggestions([])
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        searchQueryRef.current = ''
        setSearchQuery('')
        setSuggestions([])
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function handleSearchChange(value: string) {
    searchQueryRef.current = value
    setSearchQuery(value)
    const normalizedQuery = value.trim().toLocaleLowerCase('pt-BR')
    setSuggestions(
      normalizedQuery
        ? availableGames
            .filter((game) => game.title.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
            .slice(0, 6)
        : [],
    )
  }

  /** Limpa a busca após a navegação para a página de detalhes escolhida. */
  function handleSuggestionClick() {
    searchQueryRef.current = ''
    setSearchQuery('')
    setSuggestions([])
  }

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
    } catch (error) {
      console.error('Não foi possível encerrar a sessão GameZone.', error)
      setLogoutError(getAuthErrorMessage(error, 'Não foi possível sair. Tente novamente.'))
    }
  }

  const authenticatedUser = authStatus === 'authenticated' ? user : null

  return (
    <header className="site-header">
      <div className="site-header__main">
        <Link className="site-header__brand" to="/" aria-label="GameZone - início">
          <span className="site-header__brand-icon" aria-hidden="true">
            <Gamepad2 size={24} strokeWidth={2.2} />
          </span>
          <span className="site-header__brand-name">
            Game<span>Zone</span>
          </span>
        </Link>

        <div
          className={`site-header__navigation${isMenuOpen ? ' site-header__navigation--open' : ''}`}
          id="site-header-navigation"
        >
          <nav className="site-header__desktop-nav" aria-label="Navegação principal">
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/"
              end
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/catalogo"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/ofertas"
              onClick={() => setIsMenuOpen(false)}
            >
              Ofertas
            </NavLink>
          </nav>

          <div className="site-header__mobile-actions">
            <ThemeToggleButton />
            <Link
              className="site-header__icon-button"
              to="/favoritos"
              aria-label={`Favoritos${totalFavorites > 0 ? `, ${totalFavorites} jogos` : ''}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ position: 'relative' }}
            >
              <Heart size={20} aria-hidden="true" />
              <CountBadge count={totalFavorites} kind="favorites" />
            </Link>
            {authenticatedUser ? (
              <button
                className="site-header__icon-button"
                type="button"
                aria-label={`Sair da conta de ${authenticatedUser.name}`}
                title="Sair"
                onClick={() => {
                  setIsMenuOpen(false)
                  void handleLogout()
                }}
              >
                <LogOut size={20} aria-hidden="true" />
              </button>
            ) : (
              <Link
                className="site-header__icon-button"
                to="/login"
                aria-label="Minha conta"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={20} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        <div className="site-header__search-container" ref={searchContainerRef}>
          <label className="site-header__search">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar jogos"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls="site-header-search-suggestions"
              placeholder="Buscar jogos..."
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.currentTarget.value)}
            />
          </label>
          {suggestions.length > 0 && (
            <ul
              className="site-header__search-suggestions"
              id="site-header-search-suggestions"
              aria-label="Sugestões de jogos"
            >
              {suggestions.map((game) => (
                <li key={game.id}>
                  <Link
                    className="site-header__search-suggestion"
                    to={`/jogo/${game.id}`}
                    onClick={handleSuggestionClick}
                  >
                    <img src={game.coverUrl} alt="" loading="lazy" />
                    <span className="site-header__search-suggestion-title">{game.title}</span>
                    <span className="site-header__search-suggestion-price">
                      {formatPrice(game.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="site-header__desktop-actions">
          <ThemeToggleButton />
          <Link
            className="site-header__icon-button"
            to="/favoritos"
            aria-label={`Favoritos${totalFavorites > 0 ? `, ${totalFavorites} jogos` : ''}`}
            style={{ position: 'relative' }}
          >
            <Heart size={20} aria-hidden="true" />
            <CountBadge count={totalFavorites} kind="favorites" />
          </Link>
          {authenticatedUser ? (
            <button
              className="site-header__icon-button"
              type="button"
              aria-label={`Sair da conta de ${authenticatedUser.name}`}
              title="Sair"
              onClick={() => void handleLogout()}
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          ) : (
            <Link className="site-header__icon-button" to="/login" aria-label="Minha conta">
              <User size={20} aria-hidden="true" />
            </Link>
          )}
          <Link
            className="site-header__icon-button site-header__icon-button--cart"
            to="/carrinho"
            aria-label={`Carrinho${totalItems > 0 ? `, ${totalItems} itens` : ''}`}
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <CountBadge count={totalItems} kind="cart" />
          </Link>
        </div>

        {logoutError && (
          <span
            role="alert"
            style={{ color: 'var(--color-error, #ef4444)', fontSize: 12 }}
          >
            {logoutError}
          </span>
        )}

        <div className="site-header__mobile-controls">
          <Link
            className="site-header__icon-button site-header__icon-button--cart"
            to="/carrinho"
            aria-label={`Carrinho${totalItems > 0 ? `, ${totalItems} itens` : ''}`}
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <CountBadge count={totalItems} kind="cart" />
          </Link>
          <button
            className="site-header__icon-button"
            type="button"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="site-header-navigation"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? (
              <X size={21} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
