import { Link } from 'react-router-dom'

/** Página de fallback para rotas que não correspondem a uma tela da aplicação. */
function NotFound() {
  return (
    <section className="page-placeholder">
      <h1>Página não encontrada</h1>
      <p>Não encontramos a página solicitada.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  )
}

export default NotFound
