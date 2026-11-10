import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import './MainLayout.css'

/** Layout compartilhado pelas páginas, incluindo cabeçalho, conteúdo e rodapé. */
function MainLayout() {
  const { error: cartError, refresh: refreshCart } = useCart()
  const { error: favoritesError, refresh: refreshFavorites } = useFavorites()

  return (
    <div className="app-layout">
      <Header />
      {(cartError || favoritesError) && (
        <section className="app-layout__sync-errors" aria-label="Erros de sincronização">
          {cartError && (
            <p role="alert">
              {cartError}{' '}
              <button
                type="button"
                onClick={() =>
                  void refreshCart().catch((error: unknown) =>
                    console.error('Não foi possível recarregar o carrinho.', error),
                  )
                }
              >
                Tentar novamente
              </button>
            </p>
          )}
          {favoritesError && (
            <p role="alert">
              {favoritesError}{' '}
              <button
                type="button"
                onClick={() =>
                  void refreshFavorites().catch((error: unknown) =>
                    console.error('Não foi possível recarregar os favoritos.', error),
                  )
                }
              >
                Tentar novamente
              </button>
            </p>
          )}
        </section>
      )}
      <main className="app-layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
