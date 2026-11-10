import { Code, Gamepad2, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Footer.css'

/** Rodapé compartilhado com informações e navegação complementar da loja. */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <section className="site-footer__brand" aria-labelledby="footer-brand-title">
          <Link className="site-footer__logo" to="/" id="footer-brand-title">
            <Gamepad2 size={22} aria-hidden="true" />
            <span>
              Game<span className="site-footer__logo-accent">Zone</span>
            </span>
          </Link>
          <p>
            Seu próximo jogo favorito está aqui. Explore o universo dos games em um só lugar.
          </p>
          <div className="site-footer__support" aria-label="Suporte e segurança">
            <Mail size={18} aria-hidden="true" />
            <ShieldCheck size={18} aria-hidden="true" />
            <Code size={18} aria-hidden="true" />
          </div>
        </section>

        <nav className="site-footer__column" aria-labelledby="footer-links-title">
          <h2 id="footer-links-title">Links Úteis</h2>
          <ul>
            <li><Link to="/">Início</Link></li>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/ofertas">Ofertas</Link></li>
            <li><Link to="/favoritos">Favoritos</Link></li>
            <li><Link to="/carrinho">Carrinho</Link></li>
          </ul>
        </nav>

        <nav className="site-footer__column" aria-labelledby="footer-categories-title">
          <h2 id="footer-categories-title">Categorias Populares</h2>
          <ul>
            <li><Link to="/catalogo?genero=acao">Ação</Link></li>
            <li><Link to="/catalogo?genero=rpg">RPG</Link></li>
            <li><Link to="/catalogo?genero=estrategia">Estratégia</Link></li>
            <li><Link to="/catalogo?genero=aventura">Aventura</Link></li>
          </ul>
        </nav>

        <section className="site-footer__legal" aria-labelledby="footer-legal-title">
          <h2 id="footer-legal-title">Aviso Legal</h2>
          <p>Projeto Acadêmico Demonstrativo — Sem fins lucrativos e sem transações reais</p>
        </section>
      </div>
      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} GameZone. Projeto acadêmico demonstrativo.</p>
      </div>
    </footer>
  )
}

export default Footer
