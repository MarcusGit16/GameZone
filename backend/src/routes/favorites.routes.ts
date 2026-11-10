import { Router } from 'express'
import {
  add,
  list,
  remove,
} from '../controllers/favorites.controller.js'
import requireAuth from '../middlewares/require-auth.js'

const favoritesRoutes = Router()

favoritesRoutes.get('/api/favorites', requireAuth, list)
favoritesRoutes.post('/api/favorites', requireAuth, add)
favoritesRoutes.delete('/api/favorites/:source/:gameId', requireAuth, remove)

export default favoritesRoutes
