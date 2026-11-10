import { Router } from 'express'
import { getDatabasePool } from '../config/database.js'

const apiRoutes = Router()

apiRoutes.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

apiRoutes.get('/api/db-status', async (_request, response) => {
  try {
    await getDatabasePool().query('SELECT 1')
    response.status(200).json({ status: 'connected' })
  } catch (error) {
    console.error('Não foi possível verificar a conexão com o MariaDB.', error)
    response.status(503).json({
      status: 'unavailable',
      message: 'Não foi possível conectar ao banco MariaDB. Verifique a configuração.',
    })
  }
})

export default apiRoutes
