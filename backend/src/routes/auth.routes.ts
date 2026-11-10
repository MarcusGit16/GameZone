import { Router } from 'express'
import {
  currentUser,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js'
import requireAuth from '../middlewares/require-auth.js'

const authRoutes = Router()

authRoutes.post('/api/auth/register', register)
authRoutes.post('/api/auth/login', login)
authRoutes.get('/api/auth/me', requireAuth, currentUser)
authRoutes.post('/api/auth/logout', logout)

export default authRoutes
