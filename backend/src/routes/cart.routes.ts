import { Router } from 'express'
import { add, empty, list, remove, update } from '../controllers/cart.controller.js'
import requireAuth from '../middlewares/require-auth.js'

const cartRoutes = Router()

cartRoutes.get('/api/cart', requireAuth, list)
cartRoutes.post('/api/cart/items', requireAuth, add)
cartRoutes.patch('/api/cart/items/:source/:gameId', requireAuth, update)
cartRoutes.delete('/api/cart/items/:source/:gameId', requireAuth, remove)
cartRoutes.delete('/api/cart', requireAuth, empty)

export default cartRoutes
