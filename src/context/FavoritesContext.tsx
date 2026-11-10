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

import type { Game } from '../types/game'
import { useAuth } from './AuthContext'
import {
  addFavorite as addFavoriteRequest,
  getFavorites as getFavoritesRequest,
  getFavoritesErrorMessage,
  removeFavorite as removeFavoriteRequest,
} from '../services/favoritesService'
import { hasSameGameIdentity, withGameSource } from '../services/gameSource'

interface FavoritesContextValue {
  favorites: Game[]
  toggleFavorite: (game: Game) => void
  isFavorite: (game: Game) => boolean
  totalFavorites: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface FavoritesProviderProps {
  children: ReactNode
}

interface AuthSnapshot {
  status: string
  userId: string | null
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { status, user } = useAuth()
  const [favorites, setFavorites] = useState<Game[]>([])
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authRef = useRef<AuthSnapshot>({ status, userId: user?.id ?? null })
  const favoritesRef = useRef<Game[]>([])
  const requestId = useRef(0)
  const loadedUserIdRef = useRef<string | null>(null)
  const hydrationRef = useRef<{ userId: string; promise: Promise<void> } | null>(null)
  const mutationQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    authRef.current = { status, userId: user?.id ?? null }
  }, [status, user?.id])

  useEffect(() => {
    favoritesRef.current = favorites
  }, [favorites])

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
    favoritesRef.current = []
    setFavorites([])
    setError(null)
    setIsLoading(true)

    const promise = getFavoritesRequest()
      .then((items) => {
        if (
          request !== requestId.current ||
          authRef.current.status !== 'authenticated' ||
          authRef.current.userId !== userId
        ) {
          return
        }

        favoritesRef.current = items
        loadedUserIdRef.current = userId
        setLoadedUserId(userId)
        setFavorites(items)
        setIsLoading(false)
      })
      .catch((loadError: unknown) => {
        if (request === requestId.current) {
          setIsLoading(false)
          setError(getFavoritesErrorMessage(loadError))
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
    (action: (currentFavorites: Game[]) => Promise<Game[]>) => {
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
        const updatedFavorites = await action(favoritesRef.current)
        if (
          authRef.current.status === 'authenticated' &&
          authRef.current.userId === userId
        ) {
          favoritesRef.current = updatedFavorites
          loadedUserIdRef.current = userId
          setLoadedUserId(userId)
          setFavorites(updatedFavorites)
        }
      })

      mutationQueue.current = operation.catch((mutationError: unknown) => {
        if (authRef.current.userId === userId) {
          setError(getFavoritesErrorMessage(mutationError))
        }
        console.error('Não foi possível sincronizar os favoritos.', mutationError)
      })
    },
    [loadForUser],
  )

  const toggleFavorite = useCallback(
    (game: Game) => {
      const normalizedGame = withGameSource(game)
      if (authRef.current.status !== 'authenticated' || !authRef.current.userId) {
        if (loadedUserId !== null) {
          setLoadedUserId(null)
          favoritesRef.current = []
          setFavorites([])
        }
        setFavorites((currentFavorites) => {
          const exists = currentFavorites.some((favorite) =>
            hasSameGameIdentity(favorite, normalizedGame),
          )
          const updatedFavorites = exists
            ? currentFavorites.filter(
                (favorite) => !hasSameGameIdentity(favorite, normalizedGame),
              )
            : [...currentFavorites, normalizedGame]
          return updatedFavorites
        })
        return
      }

      queueAccountMutation((currentFavorites) =>
        currentFavorites.some((favorite) =>
          hasSameGameIdentity(favorite, normalizedGame),
        )
          ? removeFavoriteRequest(normalizedGame)
          : addFavoriteRequest(normalizedGame),
      )
    },
    [loadedUserId, queueAccountMutation],
  )

  const visibleFavorites = useMemo(() => {
    if (status === 'authenticated' && user) {
      return loadedUserId === user.id ? favorites : []
    }

    return status === 'anonymous' && loadedUserId === null ? favorites : []
  }, [status, user, loadedUserId, favorites])

  const isFavorite = useCallback(
    (game: Game) =>
      visibleFavorites.some((favorite) =>
        hasSameGameIdentity(favorite, game),
      ),
    [visibleFavorites],
  )

  const value = useMemo(
    () => ({
      favorites: visibleFavorites,
      toggleFavorite,
      isFavorite,
      totalFavorites: visibleFavorites.length,
      isLoading:
        status === 'authenticated' &&
        Boolean(user) &&
        (isLoading || loadedUserId !== user?.id),
      error: status === 'authenticated' ? error : null,
      refresh,
    }),
    [
      visibleFavorites,
      toggleFavorite,
      isFavorite,
      status,
      isLoading,
      error,
      loadedUserId,
      user,
      refresh,
    ],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites deve ser utilizado dentro de um FavoritesProvider.')
  }

  return context
}

// The provider and its consumer hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export { FavoritesProvider, useFavorites }
