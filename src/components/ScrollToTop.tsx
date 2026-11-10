import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Rola a página ao topo sempre que caminho ou parâmetros da URL mudam. */
function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}

export default ScrollToTop
