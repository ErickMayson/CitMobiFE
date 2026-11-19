# Render Deployment Guide (Branch: `deploy`)

Este documento descreve como realizar o deploy do **CitMobiWeb** no Render a partir da branch `deploy`.

A branch `deploy` foi configurada especificamente com a URL da API remota:
- **API URL Base:** `https://citmobi2.onrender.com/citmobi`
- **Ambiente:** `production: true`

---

## Opção 1: Web Service (Recomendado - Angular SSR / Express)

O projeto possui suporte nativo a SSR (Server Side Rendering) com Node.js + Express (`server.ts`), ouvindo em `0.0.0.0:$PORT`.

### Passos no Render:
1. Acesse o painel do [Render Dashboard](https://dashboard.render.com).
2. Clique em **New +** > **Web Service**.
3. Conecte o repositório `CitMobiWeb`.
4. Configure os seguintes campos:
   - **Name:** `citmobi-web`
   - **Branch:** `deploy`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` *(ou `npm run serve:ssr:ang`)*
5. *(Opcional)* Em **Environment Variables**:
   - `NODE_VERSION`: `20.18.0`
   - `GOOGLE_MAPS_API_KEY`: *(sua chave Google Cloud se desejar ativar mapas)*
6. Clique em **Create Web Service**.

> O arquivo `render.yaml` já está configurado na raiz da branch `deploy`, permitindo também o uso via **Render Blueprint**.

---

## Opção 2: Static Site (SPA Tradicional no Render)

Se preferir hospedar apenas os assets estáticos gerados na pasta de browser:

### Passos no Render:
1. No painel do Render, clique em **New +** > **Static Site**.
2. Conecte o repositório `CitMobiWeb`.
3. Configure:
   - **Name:** `citmobi-frontend`
   - **Branch:** `deploy`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist/ang/browser`
4. Em **Redirects/Rewrites**:
   - Adicione uma regra:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
5. Clique em **Create Static Site**.

---

## Verificação e Testes

Credenciais de teste semeadas no backend (`https://citmobi2.onrender.com`):

| Perfil | Usuário | Senha |
| :--- | :--- | :--- |
| **System Admin** | `admin` | `amarelo1` |
| **System Admin** | `Mobiadm` | `mobibrasil` |
| **Operador Admin** | `gtpadm` | `gtpadm` |
| **Motorista** | `794582540` | `mobibrasil` |
