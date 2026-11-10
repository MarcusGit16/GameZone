# 🎮 GameZone — E-commerce de Jogos Digitais (SPA)

> Aplicação Web Single Page Application (SPA) desenvolvida com **React 19**, **TypeScript**, **Vite 8** e **Axios**, simulando uma loja digital de jogos com tema *Dark Gaming*, consumo de API pública e resiliência a falhas via dados locais de *fallback*.

---

## 📌 Badges

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![Status do Build](https://img.shields.io/badge/Build-Passing-22C55E?style=flat-square)

---

## 🚀 Funcionalidades Principais

- **Vitrine & Destaques (Home):** Carrossel interativo de jogos em destaque (`HeroBanner`) com rotação automática via `setInterval` e seções de ofertas imperdíveis.
- **Catálogo com Busca & Filtros Dinâmicos:** Filtragem em tempo real otimizada com `useMemo` por busca textual local, gênero (pré-selecionável por parâmetro de URL), plataforma e ordenação por preço, nome ou avaliação.
- **Ficha Técnica Detalhada (`GameDetails`):** Galeria interativa de capturas de tela com alternância de mídia ativa, preços formatados em BRL e Buy Box lateral.
- **Carrinho de Compras (`CartContext`):** Gestão de quantidades, remoção de itens, cupons de desconto demonstrativos (`GAMEZONE10`, `DESCONTO10`) e persistência no MariaDB por conta autenticada. O carrinho de visitante é mantido apenas em memória; dados antigos em `localStorage` não são importados nem apagados.
- **Lista de Desejos (`FavoritesContext`):** Favoritos persistidos no MariaDB por conta autenticada, com opção de transferência direta de itens para o carrinho.
- **Temas claro e escuro (`ThemeContext`):** Alternância pelo cabeçalho, com tema escuro como padrão e preferência salva no navegador.
- **Autenticação Demonstrativa (`Auth`):** Formulário de Login e Cadastro com alternância de abas, validação local (Regex de e-mail, confirmação de senha) e gravação de perfil em `localStorage` (sem armazenamento de senhas).
- **Checkout Simulado (`Checkout`):** Proteção de rota para usuários logados, escolha de pagamento fictício (Pix com código Copia e Cola, Cartão de Crédito e Boleto), emissão de chaves de ativação digitais demonstrativas e limpeza automática do carrinho ao retornar à Home.
- **Integração de API com Fallback Resiliente:** Consumo da API pública CheapShark via `axios`. Em caso de erro de rede ou indisponibilidade, o sistema realiza fallback automático para a massa de dados local (`mockGames.ts`), mantendo a aplicação funcional.

---

## 🛠️ Stack Tecnológico

- **Front-end Core:** React 19, TypeScript, Vite 8.
- **Roteamento:** `react-router-dom` 7 (SPA).
- **Estilização:** CSS3 Modular com Variáveis Globais (`index.css`) no padrão *Dark Gaming*.
- **Estado Global:** Context API (`useContext`) para Carrinho, Favoritos e Tema; carrinho e favoritos autenticados são sincronizados com o backend GameZone, enquanto a preferência de tema permanece em `localStorage`.
- **Requisições HTTP:** Axios (`src/services/api.ts` e `src/services/gameService.ts`).
- **Iconografia:** `lucide-react`.

---

## 📂 Estrutura do Projeto

```text
src/
├── components/   # Componentes visuais reutilizáveis (Header, Footer, GameCard, HeroBanner)
├── context/      # Estado global da aplicação (CartContext, FavoritesContext)
├── data/         # Massa de dados locais e fallback (mockGames.ts)
├── layouts/      # Layout base SPA (MainLayout)
├── pages/        # Telas da aplicação (Home, Catalog, GameDetails, Cart, Favorites, Auth, Checkout)
├── services/     # Cliente HTTP Axios e integração com API (api.ts, gameService.ts)
├── types/        # Contratos de dados TypeScript (game.ts, cart.ts, user.ts)
├── App.tsx       # Provedores de contexto e mapeamento de rotas
└── index.css     # Design System e Variáveis Globais de CSS
```

## 🔧 Comandos do Projeto

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Execução Local

1. **Instalar as dependências:**

   ```bash
   npm install
   ```

2. **Executar o ambiente de desenvolvimento:**

   ```bash
   npm run dev
   ```

3. **Executar a verificação de linter (ESLint):**

   ```bash
   npm run lint
   ```

4. **Gerar o build de produção:**

   ```bash
   npm run build
   ```

## ⚠️ Aviso de Projeto Acadêmico / Demonstrativo

> **Nota:** O GameZone é um projeto exclusivamente acadêmico e demonstrativo. Todos os fluxos de autenticação, pagamentos (Pix, Cartão, Boleto) e chaves de ativação digitais geradas são fictícios e ocorrem 100% no lado do cliente (Client-Side). Nenhuma cobrança financeira real é realizada e nenhuma licença de jogo válida é emitida.

## 📄 Documentação Técnica Detalhada

Para conferir o detalhamento completo da arquitetura, decisões de desenvolvimento, diagrama de dados e evolução etapa a etapa, consulte o arquivo [`Relatorio_Tecnico.md`](./Relatorio_Tecnico.md) na raiz do repositório.
