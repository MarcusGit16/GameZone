import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/currency'

import './Cart.css'

const COUPON_DISCOUNT_RATE = 0.1
const VALID_COUPONS = new Set(['GAMEZONE10', 'DESCONTO10'])

/** Página do carrinho com quantidades, cupons e resumo da compra simulada. */
function Cart() {
  const { cart, removeFromCart, clearCart, updateQuantity, subtotal, isLoading } =
    useCart()
  const { user, status: authStatus, error: authError, refreshSession } = useAuth()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  const offerSavings = cart.reduce(
    (total, item) =>
      total +
      Math.max(0, (item.game.originalPrice ?? item.game.price) - item.game.price) *
        item.quantity,
    0,
  )
  const couponDiscount = appliedCoupon ? subtotal * COUPON_DISCOUNT_RATE : 0
  const total = Math.max(0, subtotal - couponDiscount)

  function handleApplyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedCode = couponCode.trim().toUpperCase()

    if (VALID_COUPONS.has(normalizedCode)) {
      setAppliedCoupon(normalizedCode)
      setCouponCode(normalizedCode)
      setCouponError('')
      return
    }

    setAppliedCoupon(null)
    setCouponError('Cupom inválido. Confira o código e tente novamente.')
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  function handleProceedToCheckout() {
    if (authStatus === 'authenticated' && user) {
      navigate('/checkout')
      return
    }

    if (authStatus === 'anonymous') {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }

  if (cart.length === 0) {
    if (isLoading) {
      return (
        <section className="cart-empty" role="status" aria-live="polite">
          <p>Carregando seu carrinho...</p>
        </section>
      )
    }

    return (
      <section className="cart-empty">
        <span className="cart-empty__icon">
          <ShoppingBag size={34} aria-hidden="true" />
        </span>
        <h1>Seu carrinho está vazio</h1>
        <p>Explore nosso catálogo e encontre sua próxima aventura.</p>
        <button type="button" onClick={() => navigate('/catalogo')}>
          Explorar Catálogo de Jogos
        </button>
      </section>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-page__heading">
        <span className="cart-page__eyebrow">Seus jogos, prontos para a aventura</span>
        <h1>
          Seu Carrinho de Compras
          <span className="cart-page__count" aria-label={`${totalItems} itens`}>
            {totalItems}
          </span>
        </h1>
      </header>

      <div className="cart-page__layout">
        <section className="cart-list" aria-label="Itens no carrinho">
          <div className="cart-list__heading">
            <h2>Seus jogos</h2>
            <button
              className="cart-list__clear"
              type="button"
              onClick={() => {
                clearCart()
                handleRemoveCoupon()
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Esvaziar Carrinho
            </button>
          </div>

          <div className="cart-list__items">
            {cart.map(({ game, quantity }) => (
              <article className="cart-item" key={`${game.source}:${game.id}`}>
                <Link
                  className="cart-item__cover"
                  to={`/jogo/${game.id}`}
                  aria-label={`Ver detalhes de ${game.title}`}
                >
                  <img src={game.coverUrl} alt={`Capa de ${game.title}`} />
                </Link>

                <div className="cart-item__details">
                  <Link className="cart-item__title" to={`/jogo/${game.id}`}>
                    {game.title}
                  </Link>
                  <p className="cart-item__genres">{game.genre.join(' · ')}</p>
                  <div className="cart-item__platforms" aria-label="Plataformas">
                    {game.platforms.map((platform) => (
                      <span key={platform}>{platform}</span>
                    ))}
                  </div>

                  <div className="cart-item__quantity" aria-label={`Quantidade de ${game.title}`}>
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${game.title}`}
                      onClick={() => updateQuantity(game, quantity - 1)}
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${game.title}`}
                      disabled={quantity >= 99}
                      onClick={() => updateQuantity(game, quantity + 1)}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="cart-item__pricing">
                  {game.originalPrice !== undefined && (
                    <span className="cart-item__original-price">
                      {formatPrice(game.originalPrice)}
                    </span>
                  )}
                  <span className="cart-item__unit-price">
                    {formatPrice(game.price)} <small>/ un.</small>
                  </span>
                  <strong>{formatPrice(game.price * quantity)}</strong>
                </div>

                <button
                  className="cart-item__remove"
                  type="button"
                  aria-label={`Remover ${game.title} do carrinho`}
                  onClick={() => removeFromCart(game)}
                >
                  <Trash2 size={19} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>

          <Link className="cart-list__continue" to="/catalogo">
            <ArrowLeft size={17} aria-hidden="true" />
            Continuar Comprando
          </Link>
        </section>

        <aside className="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">Resumo do Pedido</h2>

          <form className="cart-summary__coupon" onSubmit={handleApplyCoupon}>
            <label htmlFor="cart-coupon">Cupom de desconto</label>
            <div className="cart-summary__coupon-input">
              <input
                id="cart-coupon"
                type="text"
                autoComplete="off"
                placeholder="Digite seu cupom"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.currentTarget.value)
                  setCouponError('')
                }}
              />
              {appliedCoupon ? (
                <button
                  className="cart-summary__coupon-remove"
                  type="button"
                  aria-label="Remover cupom"
                  onClick={handleRemoveCoupon}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              ) : (
                <button type="submit">Aplicar</button>
              )}
            </div>
            {appliedCoupon && (
              <p className="cart-summary__coupon-success" role="status">
                <CheckCircle size={15} aria-hidden="true" />
                Cupom {appliedCoupon} aplicado: 10% de desconto.
              </p>
            )}
            {couponError && (
              <p className="cart-summary__coupon-error" role="alert">
                {couponError}
              </p>
            )}
          </form>

          <div className="cart-summary__breakdown">
            <div>
              <span>Subtotal dos Produtos</span>
              <strong>{formatPrice(subtotal + offerSavings)}</strong>
            </div>
            {offerSavings > 0 && (
              <div className="cart-summary__saving">
                <span>Desconto de Ofertas</span>
                <strong>-{formatPrice(offerSavings)}</strong>
              </div>
            )}
            {appliedCoupon && (
              <div className="cart-summary__saving">
                <span>Desconto de Cupom (10%)</span>
                <strong>-{formatPrice(couponDiscount)}</strong>
              </div>
            )}
            <div className="cart-summary__subtotal">
              <span>Subtotal atual</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
          </div>

          <div className="cart-summary__total">
            <span>Total Final</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <button
            className="cart-summary__checkout"
            type="button"
            onClick={handleProceedToCheckout}
            disabled={authStatus === 'checking' || authStatus === 'unavailable'}
          >
            <CheckCircle size={19} aria-hidden="true" />
            {authStatus === 'checking' ? 'Verificando sessão...' : 'Finalizar Compra'}
          </button>

          {authStatus === 'unavailable' && (
            <div role="alert">
              <p>{authError ?? 'Não foi possível verificar sua sessão.'}</p>
              <button type="button" onClick={() => void refreshSession()}>
                Tentar novamente
              </button>
            </div>
          )}

          <p className="cart-summary__notice">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              Projeto Acadêmico Demonstrativo — Não haverá cobrança nem transação financeira real.
            </span>
          </p>
        </aside>
      </div>
    </div>
  )
}

export default Cart
