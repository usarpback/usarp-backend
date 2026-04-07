# USARP Tool API

USARP Tool é uma ferramenta de apoio à adoção do método USARP na elicitação e especificação de requisitos de usabilidade em projetos de software.

## 🚀 Tecnologias

- Node.js
- Express
- PostgreSQL ou MariaDB (via Sequelize ORM)
- JWT para autenticação
- bcrypt para hashing de senha
- nodemailer + handlebars para templates de e-mail
- helmet e cors para segurança
- date-fns e date-fns-tz para manipulação de datas
- Sequelize-CLI para migrações
- ESLint + Prettier para padronização de código

---

## 📋 Pré-requisitos

- Node.js (v18+)
- npm ou yarn
- PostgreSQL ou MariaDB rodando localmente ou em container
- Conta de e-mail SMTP (ex.: Gmail com senha de app)

---

## 🔧 Instalação

Clone o repositório:

```bash
git clone https://github.com/seu-usuario/usarp-tool-api.git
cd usarp-tool-api
```

Instale as dependências:

```bash
npm install
```

---

## ⚙️ Configuração

Crie um arquivo .env na raiz do projeto baseado no .env-example:

```bash
JWT_SECRET_KEY=

LOCAL_NODE_PORT=
DOCKER_NODE_PORT=

LOCAL_DB_PORT=

DB_PORT=

DB_NAME=
DB_HOST= # Quando rodando via docker-compose, use DB_HOST=db (o nome do serviço). Quando for conectar a um Postgres local, use localhost.
DB_USERNAME=
DB_PASSWORD=
DIALECT=

CORS_ORIGIN=
```

(Opcional) Crie o banco de dados manualmente:

```bash
CREATE DATABASE usarp_db;
```

Rode as migrações para criar as tabelas:

```bash
npx sequelize db:migrate
```

---

## 🚀 Executando localmente

Modo desenvolvimento (com recarga automática):

```bash
npm run dev
```

---

# 🐳 Executando com Docker Compose

⚠️ Importante: Quando rodando via Docker Compose, use DB_HOST=db no .env. Se for conectar em um PostgreSQL local, use DB_HOST=localhost.

Subir os containers:

```bash
docker-compose up -d
```

Parar os containers:

```bash
docker-compose down
```

# 📖 Documentação da API

A API é documentada com Swagger (OpenAPI 3.0) para facilitar a exploração dos endpoints.

Após iniciar o servidor (localmente ou via Docker), acesse no navegador:

```bash
http://localhost:3333/docs
```

📚 O que você encontra na documentação:

- Endpoints de autenticação (signup, login, recuperação de senha).
- Gerenciamento de usuários (perfil, atualização, exclusão de conta).
- Projetos (criação, listagem, detalhes).
- User Stories (registro individual e em lote, listagem com paginação).
- Sessões de Brainstorming (criação e listagem/contagem).
