import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ThemeProvider } from './context/ThemeContext'
import ScrollToTop from './components/ScrollToTop'
import MainLayout from './layouts/MainLayout'
import Auth from './pages/Auth'
import Cart from './pages/Cart'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import Deals from './pages/Deals'
import Favorites from './pages/Favorites'
import GameDetails from './pages/GameDetails'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

/** Composição raiz da SPA, com roteador, providers globais e rotas da loja. */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="catalogo" element={<Catalog />} />
                  <Route path="ofertas" element={<Deals />} />
                  <Route path="jogo/:id" element={<GameDetails />} />
                  <Route path="carrinho" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="favoritos" element={<Favorites />} />
                  <Route path="login" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
