import session from 'express-session'
import MySQLStoreFactory from 'express-mysql-session'
import { getDatabasePool } from './database.js'

const sessionSecret = process.env.SESSION_SECRET?.trim()

if (!sessionSecret || sessionSecret === 'SUBSTITUA_POR_UM_SEGREDO_ALEATORIO_FORTE') {
  throw new Error('Configure um SESSION_SECRET forte no ambiente do backend.')
}

const MySQLStore = MySQLStoreFactory(session)

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    createDatabaseTable: false,
    expiration: 7 * 24 * 60 * 60 * 1000,
    schema: {
      tableName: 'user_sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data',
      },
    },
  },
  getDatabasePool(),
)

export { sessionSecret, sessionStore }
