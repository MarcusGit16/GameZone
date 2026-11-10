const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount)
}
