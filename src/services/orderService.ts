import axios from 'axios'

import { backendApi } from './backendApi'

export type OrderPaymentMethod = 'pix' | 'credit_card' | 'boleto'
export type OrderProductSource = 'mock' | 'cheapshark'

export interface CreateOrderRequest {
  items: {
    gameId: string
    source: OrderProductSource
    quantity: number
    expectedUnitPrice: number
  }[]
  paymentMethod: OrderPaymentMethod
}

export interface CreatedOrderResponse {
  orderNumber: string
  currency: 'BRL'
  subtotal: number
  discountTotal: number
  total: number
  items: {
    gameId: string
    title: string
    unitPrice: number
    quantity: number
  }[]
}

interface ApiErrorResponse {
  message?: unknown
  code?: unknown
}

export async function createOrder(
  order: CreateOrderRequest,
): Promise<CreatedOrderResponse> {
  const response = await backendApi.post<CreatedOrderResponse>('/orders', order)
  return response.data
}

export function getOrderErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const code = error.response?.data?.code
    if (code === 'PRICE_QUOTE_UNAVAILABLE') {
      return 'Jogos da CheapShark ainda não podem ser finalizados: falta uma cotação confirmada em BRL.'
    }

    const message = error.response?.data?.message
    if (typeof message === 'string') {
      return message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor. O pedido não foi confirmado.'
    }
  }

  return fallback
}
