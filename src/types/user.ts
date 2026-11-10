/**
 * Perfil demonstrativo salvo localmente para identificar a sessão simulada.
 * Não inclui senha nem credenciais de pagamento.
 */
export interface User {
  /** Identificador local do perfil. */
  id: string
  /** Nome de exibição do usuário. */
  name: string
  /** E-mail usado para exibição e identificação do perfil. */
  email: string
}
