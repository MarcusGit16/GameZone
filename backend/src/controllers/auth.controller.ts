import type { Request, Response } from 'express'
import {
  authenticateUser,
  AuthError,
  getUserById,
  registerUser,
} from '../services/auth.service.js'

function sendError(error: unknown, response: Response, operation: string): void {
  if (error instanceof AuthError) {
    response.status(error.statusCode).json({ message: error.message })
    return
  }

  console.error(`Falha na operação de autenticação: ${operation}.`, error)
  response.status(500).json({ message: 'Não foi possível concluir a operação.' })
}

function getRequestFields(request: Request): Record<string, unknown> {
  if (typeof request.body !== 'object' || request.body === null) {
    return {}
  }

  return request.body as Record<string, unknown>
}

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

export async function register(request: Request, response: Response): Promise<void> {
  try {
    const { name, email, password } = getRequestFields(request)
    const user = await registerUser(name, email, password)

    await regenerateSession(request)
    request.session.userId = user.id
    await saveSession(request)

    response.status(201).json({ user })
  } catch (error) {
    sendError(error, response, 'cadastro')
  }
}

export async function login(request: Request, response: Response): Promise<void> {
  try {
    const { email, password } = getRequestFields(request)
    const user = await authenticateUser(email, password)

    await regenerateSession(request)
    request.session.userId = user.id
    await saveSession(request)

    response.status(200).json({ user })
  } catch (error) {
    sendError(error, response, 'login')
  }
}

export async function currentUser(request: Request, response: Response): Promise<void> {
  const userId = request.session.userId
  if (!userId) {
    response.status(401).json({ message: 'Autenticação necessária.' })
    return
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
      response.clearCookie('gamezone.sid', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      response.status(401).json({ message: 'Sessão inválida.' })
      return
    }

    response.status(200).json({ user })
  } catch (error) {
    sendError(error, response, 'consulta da sessão')
  }
}

export async function logout(request: Request, response: Response): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })

    response.clearCookie('gamezone.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    response.status(200).json({ message: 'Sessão encerrada.' })
  } catch (error) {
    sendError(error, response, 'logout')
  }
}
