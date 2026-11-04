# ClothCo Wholesale Platform

> BTEC Unit 6 — Cloud Migration Project  
> B2B Ready-Made Clothing Distribution Platform

A full-stack wholesale clothing web application with a client-facing trade portal and an internal staff/manager operations dashboard. Designed for cloud deployment on AWS (ERP/CRM/WMS migration).

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### Steps

```bash
# 1. Navigate to the project
cd ~/Desktop/clothingCompany

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set MONGO_URI if not using default localhost

# 4. Start the development server (auto-seeds on first run)
npm run dev
```

- **Client Portal:** http://localhost:3000
- **Staff/Manager Dashboard:** http://localhost:3000/dashboard

The database seeds automatically on first start if empty. To re-seed manually: `npm run seed`

---

## Demo Credentials

| Role    | Email                   | Password      |
|---------|-------------------------|---------------|
| Manager | admin@clothco.com       | Admin1234!    |
| Staff   | staff1@clothco.com      | Staff1234!    |
| Staff   | staff2@clothco.com      | Staff1234!    |
| Staff   | staff3@clothco.com      | Staff1234!    |
| Client  | client1@clothco.com     | Client1234!   |
| Client  | client2@clothco.com     | Client1234!   |
| Client  | client3@clothco.com     | Client1234!   |
| Client  | client4@clothco.com     | Client1234!   |
| Client  | client5@clothco.com     | Client1234!   |

---

## NPM Scripts

| Script        | Command             | Purpose                              |
|---------------|---------------------|--------------------------------------|
| `npm run dev` | `nodemon backend/server.js` | Development server with hot reload |
| `npm start`   | `node backend/server.js`    | Production start                   |
| `npm run seed`| `node backend/seed/seed.js` | Manual database seed               |

---

## API Endpoint Reference

All routes prefixed `/api/v1`. Auth via `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint             | Access  | Description              |
|--------|----------------------|---------|--------------------------|
| POST   | /auth/register       | Public  | Create client account    |
| POST   | /auth/login          | Public  | Login, returns JWT       |
| POST   | /auth/logout         | Public  | Client-side token drop   |
| GET    | /auth/me             | Any     | Current user from JWT    |

### Products
| Method | Endpoint                        | Access           | Description            |
|--------|---------------------------------|------------------|------------------------|
| GET    | /products                       | Public           | List products (filters)|
| GET    | /products/:id                   | Public           | Single product detail  |
| GET    | /products/:id/price-tiers       | Public           | Tier pricing breakdown |
| POST   | /products                       | Staff, Manager   | Create product         |
| PUT    | /products/:id                   | Staff, Manager   | Update product         |
| DELETE | /products/:id                   | Manager          | Soft-delete product    |

### Orders
| Method | Endpoint                | Access                 | Description               |
|--------|-------------------------|------------------------|---------------------------|
| POST   | /orders                 | Client                 | Place new order           |
| GET    | /orders                 | Client/Staff/Manager   | List orders (own/all)     |
| GET    | /orders/:id             | Client/Staff/Manager   | Order detail              |
| PATCH  | /orders/:id/cancel      | Client                 | Cancel pending order      |
| PATCH  | /orders/:id/status      | Staff, Manager         | Update fulfilment status  |
| PATCH  | /orders/:id/payment     | Manager                | Update payment status     |

### Users
| Method | Endpoint      | Access  | Description                   |
|--------|---------------|---------|-------------------------------|
| GET    | /users        | Manager | List users (filterable)       |
| GET    | /users/:id    | Manager | User detail                   |
| POST   | /users/staff  | Manager | Create staff account          |
| PATCH  | /users/:id    | Manager | Update user fields            |
| DELETE | /users/:id    | Manager | Deactivate user (soft)        |

### Metrics
| Method | Endpoint          | Access  | Description                     |
|--------|-------------------|---------|---------------------------------|
| GET    | /metrics/live     | Manager | Last 20 metric snapshots        |
| POST   | /metrics/simulate | Manager | Generate & save new snapshot    |

### Health
| Method | Endpoint    | Access | Description               |
|--------|-------------|--------|---------------------------|
| GET    | /api/v1/health | Public | Server uptime + Node version |

---

## Success / Error Response Format

**Success:**
```json
{ "success": true, "data": {}, "meta": { "total": 0, "page": 1 } }
```

**Error:**
```json
{ "success": false, "message": "Human-readable message", "code": "ERROR_CODE" }
```

---

## Project Structure

```
clothingCompany/
├── backend/
│   ├── config/         db.js — MongoDB connection
│   ├── controllers/    authController, productController, orderController,
│   │                   userController, metricController
│   ├── middleware/     auth.js (JWT + RBAC), errorHandler.js
│   ├── models/         User, Product, Order, Metric
│   ├── routes/         auth, products, orders, users, metrics
│   ├── seed/           seed.js — auto-inserts demo data if DB empty
│   ├── utils/          pricing.js (tier pricing logic), response.js
│   └── server.js       Express entry point
├── frontend/
│   ├── client/         Client Portal (dark navy/gold B2B storefront)
│   │   ├── index.html
│   │   ├── css/client.css
│   │   └── js/client.js
│   └── dashboard/      Staff & Manager Dashboard (charcoal/cyan ops tool)
│       ├── index.html
│       ├── css/dashboard.css
│       └── js/dashboard.js
├── .env.example
├── package.json
└── README.md
```

---

## Architecture Notes — Cloud Readiness (AWS)

| Concern             | Current Implementation          | AWS Migration Target                     |
|---------------------|---------------------------------|------------------------------------------|
| Config              | `.env` + `dotenv`               | AWS Systems Manager Parameter Store / Secrets Manager |
| Database            | MongoDB (local URI)             | Amazon DocumentDB (Mongo-compatible) or Atlas on AWS |
| Static Frontend     | Express static serve            | S3 + CloudFront CDN                      |
| API Server          | Node/Express, stateless         | ECS Fargate or Elastic Beanstalk         |
| Health Check        | `GET /api/v1/health`            | ALB health check target                  |
| Logging             | Morgan (stdout)                 | CloudWatch Logs                          |
| Auth                | JWT (stateless)                 | Compatible as-is; optionally add Cognito |
| Metrics             | Simulated in-DB telemetry       | CloudWatch Metrics + real EC2 agents     |

The API is stateless (no server-side sessions), all configuration is environment-variable driven, and the frontend/backend are independently deployable — all prerequisites for a clean AWS ECS/Fargate or Elastic Beanstalk deployment.

---

## Graphify (optional tooling)

[Graphify](https://github.com/Graphify-Labs/graphify) builds a local knowledge graph of the code for Claude Code. It is optional and not needed to run the app.

```bash
# Install the CLI (pinned). PyPI package is graphifyy (double y); the command is graphify.
uv tool install graphifyy==0.9.102      # or: pipx install graphifyy==0.9.102

# Build / rebuild the graph (code-only, local AST, no API key, no LLM)
GRAPHIFY_BACKEND=none graphify extract . --code-only
GRAPHIFY_BACKEND=none graphify cluster-only . --no-label   # writes GRAPH_REPORT.md

# Optional: register the PreToolUse hooks locally (lands in .claude/settings.json; move it to settings.local.json)
graphify claude install
```

Exclusions live in `.graphifyignore` (secrets, `aws/`, seed data, lockfile, and all docs/PDF/Office/images/HTML so nothing reaches an LLM). Output goes to `graphify-out/`, which is gitignored.
