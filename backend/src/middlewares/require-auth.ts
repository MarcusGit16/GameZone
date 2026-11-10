import type { RequestHandler } from 'express'

const requireAuth: RequestHandler = (request, response, next) => {
  if (!request.session.userId) {
    response.status(401).json({ message: 'Autenticação necessária.' })
    return
  }

  next()
}

export default requireAuth
