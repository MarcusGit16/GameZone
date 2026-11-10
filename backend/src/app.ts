import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { sessionStore, sessionSecret } from './config/session.js'
import authRoutes from './routes/auth.routes.js'
import cartRoutes from './routes/cart.routes.js'
import favoritesRoutes from './routes/favorites.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import apiRoutes from './routes/api.routes.js'

const app = express()
const frontendOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: frontendOrigin, credentials: true }))
app.use(express.json())
app.use(
  session({
    name: 'gamezone.sid',
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
)
app.use(authRoutes)
app.use(cartRoutes)
app.use(favoritesRoutes)
app.use(ordersRoutes)
app.use(apiRoutes)

export default app
