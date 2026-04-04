# Login isolado

Estrutura criada separando somente a parte de login:

- `index.html` → tela de login
- `css/loginf.css` → estilo do login
- `js/loginf.js` → lógica do front
- `api/login.js` → endpoint de autenticação
- `app.html` → página vazia para onde o login redireciona

## Variáveis de ambiente

Use no deploy:

- `LOGIN_USERS=usuario1:senha1,usuario2:senha2`
- `LOGIN_ADMINS=usuario1`

## Fluxo

1. Usuário entra em `index.html`
2. Front chama `POST /api/login`
3. Em sucesso, salva no `sessionStorage`:
   - `token`
   - `loggedUser`
   - `isAdmin`
4. Redireciona para `app.html`
