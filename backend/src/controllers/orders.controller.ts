import type { Request, Response } from 'express'
import { OrderError, createOrder } from '../services/orders.service.js'

export async function create(request: Request, response: Response): Promise<void> {
  const userId = request.session.userId
  if (!userId) {
    response.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    })
    return
  }

  try {
    const order = await createOrder(userId, request.body)
    response.status(201).json(order)
  } catch (error) {
    if (error instanceof OrderError) {
      response.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      })
      return
    }

    console.error('Não foi possível registrar o pedido.', error)
    response.status(500).json({
      code: 'ORDER_CREATION_FAILED',
      message: 'Não foi possível registrar o pedido. Tente novamente.',
    })
  }
}
