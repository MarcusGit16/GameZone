import { Router } from 'express'
import { create } from '../controllers/orders.controller.js'
import requireAuth from '../middlewares/require-auth.js'

const ordersRoutes = Router()

ordersRoutes.post('/api/orders', requireAuth, create)

export default ordersRoutes
