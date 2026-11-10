import axios from 'axios'

import { backendApi } from './backendApi'
import type { User } from '../types/user'

interface UserResponse {
  user: User
}

interface ApiErrorResponse {
  message?: unknown
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const response = await backendApi.post<UserResponse>('/auth/register', {
    name,
    email,
    password,
  })

  return response.data.user
}

export async function login(email: string, password: string): Promise<User> {
  const response = await backendApi.post<UserResponse>('/auth/login', {
    email,
    password,
  })

  return response.data.user
}

export async function getCurrentUser(): Promise<User> {
  const response = await backendApi.get<UserResponse>('/auth/me')
  return response.data.user
}

export async function logout(): Promise<void> {
  await backendApi.post('/auth/logout')
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') {
      return message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    }
  }

  return fallback
}

export function isUnauthenticatedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
