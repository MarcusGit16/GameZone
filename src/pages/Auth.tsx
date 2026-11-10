import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type To } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Gamepad2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { getAuthErrorMessage } from '../services/authService'

import './Auth.css'

type AuthMode = 'login' | 'register'
type AuthField = 'name' | 'email' | 'password' | 'confirmPassword'
type AuthErrors = Partial<Record<AuthField, string>>

interface AuthLocationState {
  from?: To
}

/** Formulário de cadastro e login conectado à autenticação do backend. */
function Auth() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<AuthErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const { login, register } = useAuth()
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state: AuthLocationState | null
  }
  const navigate = useNavigate()
  const redirectTo = location.state?.from || '/'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!isSubmitted) {
      return
    }

    const timeoutId = window.setTimeout(() => navigate(redirectTo, { replace: true }), 1000)
    return () => window.clearTimeout(timeoutId)
  }, [isSubmitted, navigate, redirectTo])

  function handleChangeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setErrors({})
    setIsSubmitted(false)
    setAuthError('')
  }

  function validateForm(): AuthErrors {
    const nextErrors: AuthErrors = {}
    const normalizedEmail = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Insira um e-mail válido.'
    }

    if (password.length < 6) {
      nextErrors.password = 'A senha deve ter pelo menos 6 caracteres.'
    }

    if (mode === 'register') {
      if (name.trim().length === 0) {
        nextErrors.name = 'Informe seu nome.'
      }

      if (confirmPassword !== password) {
        nextErrors.confirmPassword = 'As senhas não coincidem.'
      }
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateForm()
    setErrors(nextErrors)
    setAuthError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }

      setIsSubmitted(true)
    } catch (error) {
      setAuthError(
        getAuthErrorMessage(
          error,
          mode === 'register'
            ? 'Não foi possível criar sua conta. Tente novamente.'
            : 'Não foi possível entrar. Tente novamente.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-card__brand" to="/" aria-label="GameZone - início">
          <span className="auth-card__brand-icon">
            <Gamepad2 size={24} aria-hidden="true" />
          </span>
          <span>
            Game<span>Zone</span>
          </span>
        </Link>

        <header className="auth-card__heading">
          <h1 id="auth-title">{title}</h1>
          <p>
            {mode === 'login'
              ? 'Entre para continuar sua jornada gamer.'
              : 'Junte-se à comunidade GameZone.'}
          </p>
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de autenticação">
          <button
            className={`auth-tabs__tab${mode === 'login' ? ' auth-tabs__tab--active' : ''}`}
            id="auth-login-tab"
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            aria-controls="auth-form-panel"
            onClick={() => handleChangeMode('login')}
          >
            Já tenho conta
          </button>
          <button
            className={`auth-tabs__tab${mode === 'register' ? ' auth-tabs__tab--active' : ''}`}
            id="auth-register-tab"
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            aria-controls="auth-form-panel"
            onClick={() => handleChangeMode('register')}
          >
            Criar nova conta
          </button>
        </div>

        <form
          className="auth-form"
          id="auth-form-panel"
          role="tabpanel"
          aria-labelledby={mode === 'login' ? 'auth-login-tab' : 'auth-register-tab'}
          noValidate
          onSubmit={handleSubmit}
        >
          {mode === 'register' && (
            <div className="auth-form__field">
              <label htmlFor="auth-name">Nome</label>
              <div className={`auth-form__input${errors.name ? ' auth-form__input--error' : ''}`}>
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
                />
              </div>
              {errors.name && (
                <p className="auth-form__error" id="auth-name-error">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div className="auth-form__field">
            <label htmlFor="auth-email">E-mail</label>
            <div className={`auth-form__input${errors.email ? ' auth-form__input--error' : ''}`}>
              <Mail size={18} aria-hidden="true" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
              />
            </div>
            {errors.email && (
              <p className="auth-form__error" id="auth-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-form__field">
            <label htmlFor="auth-password">Senha</label>
            <div
              className={`auth-form__input${errors.password ? ' auth-form__input--error' : ''}`}
            >
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="auth-password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Mínimo de 6 caracteres"
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'auth-password-error' : undefined}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
                minLength={6}
              />
              <button
                className="auth-form__visibility"
                type="button"
                aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                {isPasswordVisible ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="auth-form__error" id="auth-password-error">
                {errors.password}
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div className="auth-form__field">
              <label htmlFor="auth-confirm-password">Confirmar senha</label>
              <div
                className={`auth-form__input${errors.confirmPassword ? ' auth-form__input--error' : ''}`}
              >
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? 'auth-confirm-password-error' : undefined
                  }
                  onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                  required
                  minLength={6}
                />
              </div>
              {errors.confirmPassword && (
                <p className="auth-form__error" id="auth-confirm-password-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {isSubmitted && (
            <p className="auth-form__success" role="status">
              Acesso confirmado. Redirecionando...
            </p>
          )}
          {authError && (
            <p className="auth-form__error" role="alert">
              {authError}
            </p>
          )}

          <button
            className="auth-form__submit"
            type="submit"
            disabled={isSubmitted || isSubmitting}
          >
            {isSubmitted
              ? 'Aguarde...'
              : isSubmitting
                ? 'Conectando...'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-card__notice">
          Projeto Acadêmico Demonstrativo — Pagamentos e chaves de ativação são fictícios.
        </p>
      </section>
    </div>
  )
}

export default Auth
