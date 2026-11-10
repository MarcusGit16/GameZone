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

import type { User } from '../types/user'
import {
  getCurrentUser,
  isUnauthenticatedError,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../services/authService'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [error, setError] = useState<string | null>(null)
  const sessionCheckId = useRef(0)

  const refreshSession = useCallback(async () => {
    const requestId = ++sessionCheckId.current
    setStatus('checking')
    setError(null)

    try {
      const currentUser = await getCurrentUser()
      if (requestId !== sessionCheckId.current) {
        return
      }

      setUser(currentUser)
      setStatus('authenticated')
    } catch (requestError) {
      if (requestId !== sessionCheckId.current) {
        return
      }

      setUser(null)
      if (isUnauthenticatedError(requestError)) {
        setStatus('anonymous')
        return
      }

      console.error('Não foi possível verificar a sessão GameZone.', requestError)
      setStatus('unavailable')
      setError('Não foi possível verificar sua sessão. Tente novamente.')
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await loginRequest(email, password)
    sessionCheckId.current += 1
    setUser(authenticatedUser)
    setStatus('authenticated')
    setError(null)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const registeredUser = await registerRequest(name, email, password)
      sessionCheckId.current += 1
      setUser(registeredUser)
      setStatus('authenticated')
      setError(null)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch (requestError) {
      if (!isUnauthenticatedError(requestError)) {
        throw requestError
      }
    }

    sessionCheckId.current += 1
    setUser(null)
    setStatus('anonymous')
    setError(null)
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo(
    () => ({ user, status, error, login, register, logout, refreshSession }),
    [user, status, error, login, register, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.')
  }

  return context
}

// O provedor e seu hook consumidor compartilham este módulo de contexto.
// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth }
