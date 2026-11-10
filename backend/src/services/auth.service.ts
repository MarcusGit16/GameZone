import bcrypt from 'bcryptjs'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getDatabasePool } from '../config/database.js'

export interface PublicUser {
  id: string
  name: string
  email: string
}

interface UserRow extends RowDataPacket {
  id: number | string
  name: string
  email: string
  password_hash: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new AuthError('Informe um e-mail válido.', 400)
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw new AuthError('Informe um e-mail válido.', 400)
  }

  return normalizedEmail
}

function validatePassword(password: unknown): string {
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new AuthError(
      'A senha deve ter pelo menos 6 caracteres e no máximo 72 bytes.',
      400,
    )
  }

  return password
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
  }
}

async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const [rows] = await getDatabasePool().execute<UserRow[]>(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email],
  )

  return rows[0]
}

export async function registerUser(
  nameInput: unknown,
  emailInput: unknown,
  passwordInput: unknown,
): Promise<PublicUser> {
  if (typeof nameInput !== 'string' || nameInput.trim().length === 0) {
    throw new AuthError('Informe seu nome.', 400)
  }

  const name = nameInput.trim()
  if (name.length > 120) {
    throw new AuthError('O nome deve ter no máximo 120 caracteres.', 400)
  }

  const email = validateEmail(emailInput)
  const password = validatePassword(passwordInput)
  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const [result] = await getDatabasePool().execute<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    )

    return { id: String(result.insertId), name, email }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      throw new AuthError('Já existe uma conta com este e-mail.', 409)
    }

    throw error
  }
}

export async function authenticateUser(
  emailInput: unknown,
  passwordInput: unknown,
): Promise<PublicUser> {
  const email = validateEmail(emailInput)
  const password = validatePassword(passwordInput)

  const user = await findUserByEmail(email)
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AuthError('E-mail ou senha inválidos.', 401)
  }

  return toPublicUser(user)
}

export async function getUserById(id: string): Promise<PublicUser | undefined> {
  const [rows] = await getDatabasePool().execute<UserRow[]>(
    'SELECT id, name, email, password_hash FROM users WHERE id = ? LIMIT 1',
    [id],
  )

  const user = rows[0]
  return user ? toPublicUser(user) : undefined
}
