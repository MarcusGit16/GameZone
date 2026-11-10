import { createPool } from 'mysql2/promise'

let pool: ReturnType<typeof createPool> | undefined

export function getDatabasePool() {
  if (pool) {
    return pool
  }

  const user = process.env.DB_USER?.trim()
  if (!user || user === 'SEU_USUARIO_MARIADB') {
    throw new Error('Configure DB_USER no arquivo de ambiente do backend.')
  }

  const port = Number(process.env.DB_PORT ?? 3306)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT deve ser um número de porta válido.')
  }

  const database = process.env.DB_NAME?.trim()

  pool = createPool({
    host: process.env.DB_HOST?.trim() || '127.0.0.1',
    port,
    user,
    password: process.env.DB_PASSWORD ?? '',
    ...(database ? { database } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  return pool
}
