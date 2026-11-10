import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { CartItem } from '../types/cart'
import type { Game } from '../types/game'
import { useAuth } from './AuthContext'
import {
  addCartItem as addCartItemRequest,
  clearCart as clearCartRequest,
  getCart as getCartRequest,
  getCartErrorMessage,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from '../services/cartService'
import { hasSameGameIdentity, withGameSource } from '../services/gameSource'

interface CartContextValue {
  cart: CartItem[]
  addToCart: (game: Game) => void
  removeFromCart: (game: Game) => void
  updateQuantity: (game: Game, quantity: number) => void
  clearCart: () => void
  isInCart: (game: Game) => boolean
  totalItems: number
  subtotal: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface CartProviderProps {
  children: ReactNode
}

interface AuthSnapshot {
  status: string
  userId: string | null
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function CartProvider({ children }: CartProviderProps) {
  const { status, user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authRef = useRef<AuthSnapshot>({ status, userId: user?.id ?? null })
  const requestId = useRef(0)
  const loadedUserIdRef = useRef<string | null>(null)
  const hydrationRef = useRef<{ userId: string; promise: Promise<void> } | null>(null)
  const mutationQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    authRef.current = { status, userId: user?.id ?? null }
  }, [status, user?.id])

  const loadForUser = useCallback((userId: string): Promise<void> => {
    if (loadedUserIdRef.current === userId) {
      return Promise.resolve()
    }

    if (hydrationRef.current?.userId === userId) {
      return hydrationRef.current.promise
    }

    const request = ++requestId.current
    loadedUserIdRef.current = null
    setLoadedUserId(null)
    setCart([])
    setError(null)
    setIsLoading(true)

    const promise = getCartRequest()
      .then((items) => {
        if (
          request !== requestId.current ||
          authRef.current.status !== 'authenticated' ||
          authRef.current.userId !== userId
        ) {
          return
        }

        loadedUserIdRef.current = userId
        setLoadedUserId(userId)
        setCart(items)
        setIsLoading(false)
      })
      .catch((loadError: unknown) => {
        if (request === requestId.current) {
          setIsLoading(false)
          setError(getCartErrorMessage(loadError))
        }
        throw loadError
      })

    hydrationRef.current = { userId, promise }
    return promise
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && user) {
      void loadForUser(user.id).catch(() => undefined)
      return
    }

    requestId.current += 1
    hydrationRef.current = null
    loadedUserIdRef.current = null
  }, [loadForUser, status, user])

  const refresh = useCallback(async () => {
    const currentAuth = authRef.current
    if (currentAuth.status === 'authenticated' && currentAuth.userId) {
      hydrationRef.current = null
      await loadForUser(currentAuth.userId)
    }
  }, [loadForUser])

  const queueAccountMutation = useCallback(
    (action: () => Promise<CartItem[]>) => {
      const currentAuth = authRef.current
      if (currentAuth.status !== 'authenticated' || !currentAuth.userId) {
        return
      }

      const userId = currentAuth.userId
      const operation = mutationQueue.current.then(async () => {
        if (
          authRef.current.status !== 'authenticated' ||
          authRef.current.userId !== userId
        ) {
          return
        }

        await loadForUser(userId)
        if (
          authRef.current.status !== 'authenticated' ||
          authRef.current.userId !== userId
        ) {
          return
        }

        setError(null)
        const updatedCart = await action()
        if (
          authRef.current.status === 'authenticated' &&
          authRef.current.userId === userId
        ) {
          loadedUserIdRef.current = userId
          setLoadedUserId(userId)
          setCart(updatedCart)
        }
      })

      mutationQueue.current = operation.catch((mutationError: unknown) => {
        if (authRef.current.userId === userId) {
          setError(getCartErrorMessage(mutationError))
        }
        console.error('Não foi possível sincronizar o carrinho.', mutationError)
      })
    },
    [loadForUser],
  )

  const addToCart = useCallback(
    (game: Game) => {
      const normalizedGame = withGameSource(game)
      if (authRef.current.status !== 'authenticated' || !authRef.current.userId) {
        if (loadedUserId !== null) {
          setLoadedUserId(null)
          setCart([])
        }
        setCart((currentCart) => {
          const existingItem = currentCart.find((item) =>
            hasSameGameIdentity(item.game, normalizedGame),
          )
          return existingItem
            ? currentCart.map((item) =>
                hasSameGameIdentity(item.game, normalizedGame)
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              )
            : [...currentCart, { game: normalizedGame, quantity: 1 }]
        })
        return
      }

      queueAccountMutation(() => addCartItemRequest(normalizedGame))
    },
    [loadedUserId, queueAccountMutation],
  )

  const removeFromCart = useCallback(
    (game: Game) => {
      const normalizedGame = withGameSource(game)
      if (authRef.current.status !== 'authenticated' || !authRef.current.userId) {
        if (loadedUserId !== null) {
          setLoadedUserId(null)
          setCart([])
        }
        setCart((currentCart) =>
          currentCart.filter(
            (item) => !hasSameGameIdentity(item.game, normalizedGame),
          ),
        )
        return
      }

      queueAccountMutation(() => removeCartItemRequest(normalizedGame))
    },
    [loadedUserId, queueAccountMutation],
  )

  const updateQuantity = useCallback(
    (game: Game, quantity: number) => {
      if (!Number.isInteger(quantity)) {
        return
      }

      const normalizedGame = withGameSource(game)
      if (authRef.current.status !== 'authenticated' || !authRef.current.userId) {
        if (loadedUserId !== null) {
          setLoadedUserId(null)
          setCart([])
        }
        if (quantity < 1) {
          setCart((currentCart) =>
            currentCart.filter(
              (item) => !hasSameGameIdentity(item.game, normalizedGame),
            ),
          )
          return
        }

        setCart((currentCart) =>
          currentCart.map((item) =>
            hasSameGameIdentity(item.game, normalizedGame)
              ? { ...item, quantity }
              : item,
          ),
        )
        return
      }

      queueAccountMutation(() =>
        updateCartItemRequest(normalizedGame, quantity),
      )
    },
    [loadedUserId, queueAccountMutation],
  )

  const clearCart = useCallback(() => {
    if (authRef.current.status !== 'authenticated' || !authRef.current.userId) {
      if (loadedUserId !== null) {
        setLoadedUserId(null)
      }
      setCart([])
      return
    }

    queueAccountMutation(() => clearCartRequest())
  }, [loadedUserId, queueAccountMutation])

  const visibleCart = useMemo(() => {
    if (status === 'authenticated' && user) {
      return loadedUserId === user.id ? cart : []
    }

    return status === 'anonymous' && loadedUserId === null ? cart : []
  }, [status, user, loadedUserId, cart])

  const isInCart = useCallback(
    (game: Game) =>
      visibleCart.some((item) => hasSameGameIdentity(item.game, game)),
    [visibleCart],
  )
  const totalItems = visibleCart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = visibleCart.reduce(
    (total, item) => total + item.game.price * item.quantity,
    0,
  )
  const value = useMemo(
    () => ({
      cart: visibleCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
      totalItems,
      subtotal,
      isLoading:
        status === 'authenticated' &&
        Boolean(user) &&
        (isLoading || loadedUserId !== user?.id),
      error: status === 'authenticated' ? error : null,
      refresh,
    }),
    [
      visibleCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
      totalItems,
      subtotal,
      status,
      isLoading,
      error,
      loadedUserId,
      user,
      refresh,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider.')
  }

  return context
}

// The provider and its consumer hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export { CartProvider, useCart }
