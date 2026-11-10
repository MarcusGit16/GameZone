# 🎮 Relatório Técnico de Desenvolvimento e Código — GameZone

## 1. Visão Geral e Arquitetura de Software

- **Nome do Projeto:** GameZone Store
- **Natureza:** Aplicação web SPA (*Single Page Application*) que simula uma loja digital de jogos.
- **Tecnologias Core:** React 19, TypeScript, Vite 8, React Router 7, Axios e Lucide React. O ponto de entrada monta a aplicação dentro do `StrictMode` do React.
- **Identidade Visual (UX/UI):** Tema Dark Gaming próprio, com referências de organização de lojas digitais, sem reproduzir logotipos ou identidade exclusiva. As cores centrais são fundo `#0B0B10`, superfícies `#14141D`, cards `#1C1C29`, bordas `#2A2A3A` e acentos roxo `#8B5CF6` / lilás `#A78BFA`. Space Grotesk é usada em títulos e Inter em textos.

O front-end é dividido em páginas, componentes, layout, estado global, serviços, dados locais e contratos TypeScript. O roteador envolve as páginas com Providers que disponibilizam carrinho e favoritos. A obtenção de jogos passa por uma camada de serviço HTTP, com dados locais como fallback.

```text
[ Apresentação: Pages / Components / Layouts ]
                    ↓
[ Estado global: CartContext / FavoritesContext ]
                    ↓
[ Serviços: gameService.ts / api.ts ]
                    ↓
[ CheapShark API ] ← falha ou ausência de dados → [ MOCK_GAMES ]
```

O desenho não representa um backend de e-commerce. Autenticação, perfil e checkout são demonstrativos e executados no cliente; não há cobrança real, emissão de licença ou persistência remota.

## 2. Mapeamento Detalhado da Estrutura de Pastas e Código

### 📁 `src/types/` — Contratos de dados e tipagem

- **`game.ts` — `Game`:** Contrato comum para jogos vindos da API ou da massa local. Define `id`, `title`, `coverUrl` e `price` como dados essenciais. `originalPrice` e `discountPercentage` representam informações promocionais opcionais; `genre` e `platforms` são listas de rótulos; `rating`, `releaseDate` e `description` complementam a ficha do jogo. `isFeatured` e `isOffer` orientam a seleção de jogos nas seções da Home.
- **`cart.ts` — `CartItem`:** Combina a referência completa ao `game` com `quantity`, quantidade inteira mantida no carrinho. Não declara contrato de cupom nem um total próprio.
- **`user.ts` — `User`:** Perfil demonstrativo com `id`, `name` e `email`. Não possui senha, token ou informação de pagamento.

### 📁 `src/data/` — Massa de dados local e fallback

- **`mockGames.ts` — `MOCK_GAMES`:** Array tipado com jogos fictícios, capas, preços, gêneros, plataformas e, em alguns registros, avaliação, lançamento, descrição e marcações de oferta/destaque. Serve para demonstração e para manter o catálogo utilizável quando a API falha ou não retorna registros mapeáveis. Os IDs dessa massa (`neon-frontier`, por exemplo) são distintos dos IDs numéricos CheapShark.

### 📁 `src/services/` — Comunicação HTTP e adaptação de dados

- **`api.ts` — `api`:** Instância Axios compartilhada com `baseURL` em `https://www.cheapshark.com/api/1.0` e timeout de 6000 ms. Não configura chave de API.
- **`gameService.ts`:**
  - `CheapSharkDeal`, `CheapSharkGameDeal` e `CheapSharkGame` descrevem os campos consumidos nos endpoints. Os preços recebidos como texto são convertidos em número.
  - `parsePrice(value)` rejeita preço ausente, não numérico ou negativo.
  - `mapDealToGame(deal, index)` adapta uma oferta para o modelo `Game`: usa `gameID`, título, miniatura e preços, calcula o desconto quando o preço normal supera o promocional e define rótulos demonstrativos `Ofertas` e `PC`. O endpoint de ofertas usado não fornece gênero nem plataforma.
  - `fallbackGame(id)` procura um ID na massa local.
  - `getGames()` consulta `/deals` com `storeID=1` e `pageSize=12`, descarta registros incompletos, remove IDs repetidos e retorna `MOCK_GAMES` se ocorrer erro ou se não houver ofertas válidas.
  - `getGameById(id)` primeiro procura um jogo local. Para outros IDs, consulta `/games?id=...`, escolhe o menor preço entre as ofertas e mapeia os dados disponíveis. Se a chamada falhar, tenta novamente a busca na massa local. Como gêneros, avaliações, lançamento e descrição não são retornados pelo mapeamento desse endpoint, esses campos não são inventados.
  - Os erros da integração são registrados no console; os componentes recebem o resultado alternativo do serviço, evitando uma tela travada por indisponibilidade da rede.

### 📁 `src/context/` — Estado global e persistência

- **`CartContext.tsx`:**
  - Mantém `cart`, uma lista de `CartItem`, no estado React.
  - `loadCart()` lê `gamezone-cart` do `localStorage`, valida os dados e descarta itens de formato inválido. A leitura inicial é síncrona.
  - Um `useEffect` persiste as mudanças de `cart` no `localStorage`, também de forma síncrona. Erros de leitura ou escrita são registrados explicitamente.
  - `addToCart(game)` acrescenta uma unidade ao item existente ou insere uma linha com quantidade 1.
  - `removeFromCart(gameId)` remove todas as unidades daquele jogo.
  - `updateQuantity(gameId, quantity)` aceita apenas inteiros; quantidade inferior a 1 remove o item.
  - `clearCart()` esvazia a lista; `isInCart(gameId)` consulta presença; `totalItems` e `subtotal` são calculados a partir do estado.
  - `useMemo` estabiliza o objeto disponibilizado pelo Provider; `useCallback` estabiliza operações. `useCart()` acessa o contexto e lança erro se for usado fora do `CartProvider`.
  - O contexto não administra cupons: código e desconto de cupom são estados locais da página `Cart.tsx`.
- **`FavoritesContext.tsx`:**
  - Mantém `favorites: Game[]` e restaura a lista da chave `gamezone-favorites`.
  - `loadFavorites()` valida os jogos persistidos; um efeito salva as alterações.
  - `toggleFavorite(game)` inclui ou remove o jogo pelo ID; `isFavorite(gameId)` consulta a presença e `totalFavorites` deriva o total.
  - `useMemo` e `useCallback` evitam recriação desnecessária do valor e das operações; `useFavorites()` exige o Provider correspondente.

Os dois Providers persistem no navegador atual. Essa persistência local não equivale a uma base de dados ou sincronização entre dispositivos.

### 📁 `src/components/` — Componentes visuais reutilizáveis

- **`Header.tsx` / `Header.css`:** Cabeçalho responsivo com marca, navegação, busca visual e atalhos de favoritos, conta e carrinho. `useCart()` e `useFavorites()` fornecem contagens reativas para os badges; o menu móvel é controlado por `isMenuOpen`. O atalho de conta leva ao login. O Header não lê nem exibe o perfil salvo.
- **`Footer.tsx` / `Footer.css`:** Rodapé compartilhado com links de navegação, categorias, marca e avisos do projeto.
- **`GameCard.tsx` / `GameCard.css`:** Recebe um `Game` via `GameCardProps`; exibe capa, título, gêneros, plataformas e preços formatados em BRL. `handleAddToCart()` envia o jogo ao contexto e mostra feedback temporário. `handleToggleFavorite()` alterna a wishlist. A variável `isFavorited` acompanha o contexto.
- **`HeroBanner.tsx` / `HeroBanner.css`:** Recebe uma lista de jogos, prioriza os que têm `isFeatured` e permite selecionar slides pelos indicadores. `activeIndex` acompanha o slide atual. Um efeito atualiza o índice a cada 6 segundos quando há mais de um slide e limpa o temporizador ao desmontar ou quando a quantidade de slides muda. O botão de detalhes navega para a página do jogo; o botão visual de adicionar ao carrinho é demonstrativo e não altera o contexto.

### 📁 `src/layouts/` — Estrutura compartilhada

- **`MainLayout.tsx` / `MainLayout.css`:** Renderiza `Header`, o `<Outlet />` do React Router para a página filha e `Footer`. Mantém estrutura comum entre as rotas.

### 📁 `src/pages/` — Páginas e responsabilidades

- **`Home.tsx` / `Home.css`:** Solicita `getGames()` ao montar. `games` guarda o resultado e `isLoading` controla o spinner. A limpeza do efeito evita atualizações após desmontagem. Depois do carregamento, a página deriva ofertas e destaques de `isOffer` e `isFeatured`, passa a lista ao `HeroBanner` e exibe cards e categorias.
- **`Catalog.tsx` / `Catalog.css`:**
  - Solicita os jogos pelo serviço; `games` e `isLoading` representam os dados e seu carregamento.
  - `useLocation()` fornece `location.search`; `getGenreFromSearch(search)` lê o parâmetro `genero` e inicializa o filtro com uma categoria reconhecida da massa local.
  - `searchTerm`, `selectedGenre`, `selectedPlatform` e `sortBy` são estados independentes dos controles.
  - `genres` e `platforms` são derivados com `useMemo`, combinando os valores locais com os rótulos presentes nos jogos carregados.
  - `filteredAndSortedGames` filtra por título normalizado, gênero e plataforma, depois ordena por popularidade, preço, nome ou avaliação. Seu `useMemo` depende dos jogos e dos filtros selecionados.
  - `handleClearFilters()` restaura busca, filtros e ordenação. Um estado vazio é apresentado quando não há correspondências.
- **`GameDetails.tsx` / `GameDetails.css`:**
  - `useParams()` lê o `id` de `/jogo/:id`.
  - O estado `loadedGame` guarda o ID consultado junto do jogo resolvido. `isLoading` compara esse ID ao parâmetro atual, evitando mostrar por instantes o resultado de uma rota anterior.
  - Um efeito chama `getGameById(id)`. Uma flag `isActive` impede escrita no estado após desmontagem. Se o jogo não for encontrado, a página mostra estado de indisponibilidade e link para o catálogo.
  - `activeMedia` seleciona a imagem exibida na galeria demonstrativa. A galeria usa a arte disponível em diferentes enquadramentos.
  - `addedFeedback` controla o retorno visual temporário do botão de carrinho. `isFavorited` consulta o contexto; handlers separados adicionam ao carrinho ou alternam favorito.
  - A Buy Box mostra preço, desconto, ação de carrinho e estado de favorito. Campos não fornecidos pelo dado permanecem ausentes ou recebem texto claramente demonstrativo.
- **`Cart.tsx` / `Cart.css`:**
  - Consome `cart`, `removeFromCart`, `clearCart`, `updateQuantity` e `subtotal` via `useCart()`.
  - A quantidade total é somada das linhas; `offerSavings` compara `originalPrice` (quando existe) com `price`, multiplicando pela quantidade.
  - `couponCode`, `appliedCoupon` e `couponError` são estados locais. `handleApplyCoupon()` normaliza o código e aceita `GAMEZONE10` ou `DESCONTO10`, aplicando 10% sobre o subtotal atual. `handleRemoveCoupon()` limpa cupom e erro.
  - O resumo usa `Intl.NumberFormat` em `pt-BR` com moeda `BRL`, exibindo subtotal, economia promocional, desconto do cupom e total.
  - Botões atualizam quantidade, removem linhas ou esvaziam o carrinho. `handleProceedToCheckout()` valida o perfil básico em `gamezone-user`: navega a `/checkout` quando encontrado ou a `/login` com `state.from` apontando para `/checkout`.
  - Sem itens, a página oferece estado vazio e navegação ao catálogo.
- **`Favorites.tsx` / `Favorites.css`:** Consome `favorites`, `toggleFavorite` e `totalFavorites`; a coleção é renderizada em cards. `handleToggleFavorite()` remove um jogo. `handleAddToCart()` adiciona o item sem removê-lo da wishlist e define `addedGameId` para feedback temporário. `handleClearFavorites()` alterna todos os favoritos existentes até esvaziar a lista.
- **`Auth.tsx` / `Auth.css`:**
  - `mode` alterna entre login e cadastro. `email`, `password`, `name` e `confirmPassword` controlam os campos; `isPasswordVisible` alterna visibilidade; `errors`, `isSubmitted` e `storageError` controlam validação e retorno visual.
  - `validateForm()` verifica formato de e-mail com expressão regular, senha de no mínimo seis caracteres e, no cadastro, nome não vazio e confirmação igual à senha. A validação acontece no envio, não a cada tecla.
  - `handleChangeMode()` troca a aba e limpa mensagens anteriores; `handleSubmit()` bloqueia o envio HTML tradicional, valida, grava no máximo o perfil `User` em `gamezone-user` e ativa a confirmação simulada.
  - O perfil gravado contém ID derivado do e-mail, nome e e-mail. A senha não é salva. A navegação retorna ao destino em `location.state?.from` ou à Home.
- **`Checkout.tsx` / `Checkout.css`:**
  - Lê `gamezone-user` e valida seu formato. O efeito de proteção redireciona carrinho vazio ao catálogo e perfil ausente ao login com retorno a `/checkout`.
  - `paymentMethod` seleciona Pix, cartão ou boleto fictício; nenhuma opção coleta ou processa dados financeiros reais.
  - `offerSavings` e `originalSubtotal` derivam economia promocional e subtotal de referência a partir de `cart` e `subtotal`.
  - `handlePaymentSubmit()` gera um identificador de pedido e uma chave aleatória demonstrativa por unidade em cada linha e alterna para a confirmação. As chaves não ativam jogos.
  - `handleReturnHome()` chama `clearCart()` e navega à página inicial. A limpeza ocorre ao acionar esse botão, não durante a geração da confirmação.
- **`Deals.tsx`:** Página de ofertas. O código atual é uma tela direta de encaminhamento/placeholder para a experiência de catálogo de ofertas.
- **`NotFound.tsx`:** Interface para rotas não reconhecidas, com navegação de retorno.

### 📁 Raiz de `src/` — Composição e estilos globais

- **`App.tsx`:** Declara `BrowserRouter`, envolve as rotas com `CartProvider` e `FavoritesProvider` e mapeia `/`, `/catalogo`, `/ofertas`, `/jogo/:id`, `/carrinho`, `/checkout`, `/favoritos` e `/login`. `MainLayout` fornece a estrutura comum às rotas filhas; o caminho curinga aponta para `NotFound`.
- **`index.css`:** Define variáveis de cor e tipografia, reset, `box-sizing`, fundo e texto padrão, links, botões, foco visível e regras de movimento reduzido.
- **`main.tsx`:** Inicializa a raiz React, envolve `App` em `StrictMode` e importa os estilos globais.

## 3. Fluxo de Dados e Ciclo de Vida Prático

1. `Home.tsx` e `Catalog.tsx` iniciam `getGames()` em efeitos. O serviço consulta a CheapShark; se falhar ou retornar dados inválidos, entrega `MOCK_GAMES`. `GameDetails.tsx` usa o `id` da rota para procurar primeiro os mocks e depois consultar o endpoint remoto.
2. O componente apresenta os dados recebidos em `GameCard`. Ao acionar o botão de adicionar, `handleAddToCart()` chama `addToCart(game)`.
3. `CartContext` atualiza `cart`; o Provider persiste o novo estado em `gamezone-cart`.
4. `Header` consome `totalItems` do contexto e atualiza o badge sem precisar recarregar a página.
5. Em `Cart.tsx`, o usuário ajusta quantidades, remove jogos ou aplica um cupom local de 10%. Ao prosseguir, a página verifica se existe um perfil válido em `gamezone-user`.
6. Sem perfil, a navegação vai para `/login` com estado `from: '/checkout'`. Após a validação simulada, `Auth.tsx` grava o perfil sem senha e retorna ao destino indicado. Com perfil, a navegação segue diretamente para `/checkout`.
7. `Checkout.tsx` verifica carrinho e perfil, mostra opções fictícias e resumo. A confirmação gera dados apenas para exibição. O carrinho é limpo quando o usuário retorna à Home pelo botão de confirmação.
8. A wishlist percorre fluxo independente: `GameCard` atualiza `FavoritesContext`, que persiste em `gamezone-favorites`; a tela `Favorites` permite remover favoritos ou adicionar cópias ao carrinho.

## 4. Estratégias de Qualidade, Resiliência e Desempenho

- **`useMemo`:** No catálogo, calcula listas de opções e resultados filtrados/ordenados com base nas dependências; nos contextos, estabiliza os objetos expostos aos consumidores.
- **`useCallback`:** Nos contextos, mantém referências estáveis para ações e consultas expostas.
- **Fallback gracioso:** Falhas ou respostas não utilizáveis da CheapShark retornam a massa `MOCK_GAMES` nas listagens; detalhes também tentam os dados locais. O fallback evita que a ausência de rede torne o site inutilizável.
- **Carregamento assíncrono:** Home, catálogo e detalhes apresentam estado de carregamento. Os efeitos ignoram resultados obsoletos quando o componente é desmontado ou muda de ID.
- **Persistência local:** Carrinho, favoritos e perfil são armazenados no navegador. A validação básica dos dados recuperados evita tratar JSON inválido como estado válido; isso não substitui autenticação de servidor.
- **Segurança acadêmica:** Não há gateway real, armazenamento de senha, dados de cartão, cobrança ou chave de ativação funcional. Os fluxos são demonstrações client-side.
- **Validação técnica:** `npm run lint` executa ESLint. `npm run build` executa a verificação de TypeScript e a geração de bundle pelo Vite. Os dois comandos passaram nas validações realizadas durante o desenvolvimento e após a atualização deste relatório.

