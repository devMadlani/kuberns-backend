# Kuberns Backend

Backend service for Kuberns app provisioning platform.

## 1. What This Service Does

- Authenticates users (register, login, OTP verification, session cookie).
- Connects GitHub and fetches orgs/repos/branches.
- Creates webapp records and deployment records.
- Starts EC2 provisioning and tracks deployment lifecycle/logs.
- Serves metadata (regions/frameworks/databases) and plans.

## 2. Tech Stack

- Node.js 20+
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- AWS SDK v3 (`@aws-sdk/client-ec2`, `@aws-sdk/client-ssm`)
- Zod (request validation)
- Winston (logging)

## 3. Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm

### Install

```bash
cd backend
npm install
```

### Environment

Create `.env` from `.env.example`.

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:5000/git/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=...

# Optional in local dev only. Prefer IAM role in production.
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1

MAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

### Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Run

```bash
npm run dev
```

Health check:

```http
GET /health
```

## 4. Backend Architecture

### Layering

`Controller -> Service -> Repository -> Prisma`

- Controller: HTTP concerns only.
- Service: business logic and orchestration.
- Repository: persistence only.
- AWS service: cloud provisioning operations.

## Dependency Injection Strategy

This project uses manual dependency injection through constructor injection. A dependency injection framework was intentionally avoided in order to keep the architecture explicit, simple, and easy to reason about.

Each layer receives its dependencies through constructors rather than creating them internally. No class is responsible for instantiating its own dependencies. This ensures clear separation of concerns and improves maintainability.

### Layered Dependency Flow

The application follows a strict layered structure:

Controller → Service → Repository → Prisma Client

- Controllers depend only on services.
- Services depend on repositories and external providers (such as AWS services or Git providers).
- Repositories depend only on the Prisma client.
- External integrations (AWS SDK, GitHub API) are encapsulated inside dedicated service classes.

All dependency wiring is handled at the module level (composition root), typically inside route modules. This keeps dependency creation centralized and avoids hidden global state.

### Why Manual Dependency Injection Was Used

Manual constructor injection was chosen for the following reasons:

- Keeps dependencies explicit and visible
- Avoids framework overhead
- Improves testability
- Simplifies debugging
- Maintains architectural clarity
- Aligns with clean architecture principles

Each component depends only on what it needs, and dependency boundaries are clearly defined.

### Testing Benefits

Because dependencies are injected:

- Services can be tested independently with mocked repositories.
- Controllers can be tested with mocked services.
- AWS provisioning logic can be mocked without hitting real infrastructure.
- Business logic can be validated without database access.

This approach ensures that units remain isolated and testable without relying on shared or global state.

### Scalability Consideration

For the current system size, manual dependency injection provides full control with minimal complexity. If the system grows significantly in size, a lightweight DI container could be introduced, but it is not necessary at this stage.

This approach keeps the architecture clean, modular, and production-ready.

### Composition Root and Module Wiring

Each module route file (for example `auth.routes.ts`, `deployment.routes.ts`) creates concrete instances:

1. Build repository instance.
2. Build service instance with repository/providers.
3. Build controller with service.
4. Register controller handlers on Express router.

Benefits:

- No hidden global container.
- Easy to swap implementations.
- Clear ownership of wiring per module.

### Layer Boundaries (Rules)

- Controllers:
  - Parse params/body/query.
  - Validate user context.
  - Convert known validation errors to `ApiError`.
  - Must not contain business rules or direct DB access.
- Services:
  - Enforce business invariants and workflow.
  - Coordinate repositories + external providers (GitHub/AWS/Email).
  - Decide status transitions and failure handling.
- Repositories:
  - Encapsulate Prisma queries only.
  - No HTTP logic, no provider calls.
- Providers/services (`AwsService`, `GithubProvider`, `EmailService`):
  - Own external SDK/protocol details.
  - Keep third-party integration isolated.

### Request Lifecycle (Typical)

```text
Express Route
  -> auth middleware (if protected)
  -> controller
  -> service
  -> repository/provider
  -> service maps result
  -> controller writes response
  -> error middleware (for thrown errors)
```

### Transaction and Consistency Strategy

- `POST /webapps` creation is wrapped in a Prisma transaction to avoid partial records.
- Deployment start uses guarded state transition (`beginProvisioningIfStartable`) to prevent duplicate starts and race conditions.
- Failure path updates deployment + instance status and logs consistently.

### Module Structure

```text
src/
  app.ts
  server.ts
  config/
  middlewares/
  modules/
    auth/
    git/
    webapp/
    deployment/
    metadata/
    plans/
  services/
    aws.service.ts
    deployment-engine.service.ts
    email.service.ts
  utils/
```

## 5. Data Model Decisions

### Why this schema

- Multi-tenant ownership: all user resources are scoped by `userId`.
- Separation of concerns:
  - `WebApp` stores product-level config.
  - `Environment` stores deploy target config (branch, env vars, port).
  - `Instance` stores infrastructure state.
  - `Deployment` stores lifecycle of provisioning attempts.
  - `DeploymentLog` stores observability trail.
- Prevent name collisions: `@@unique([userId, name])` on `WebApp`.
- Deployment traceability: timestamps + status + error message.

### ER Diagram

```mermaid
erDiagram
  User ||--o{ WebApp : owns
  WebApp ||--o{ Environment : has
  Environment ||--|| Instance : provisions
  WebApp ||--o{ Deployment : tracks
  Environment ||--o{ Deployment : targets
  Deployment ||--o{ DeploymentLog : emits

  User {
    string id PK
    string email
    string githubId
  }

  WebApp {
    string id PK
    string userId FK
    string name
    string region
    string plan
    string framework
  }

  Environment {
    string id PK
    string webAppId FK
    string branch
    int port
    json envVars
    string status
  }

  Instance {
    string id PK
    string environmentId FK
    string instanceType
    string publicIp
    string status
  }

  Deployment {
    string id PK
    string webAppId FK
    string environmentId FK
    string status
    datetime startedAt
    datetime finishedAt
  }

  DeploymentLog {
    string id PK
    string deploymentId FK
    string level
    string message
  }
```

## 6. Provisioning Flow (High Level)

1. `POST /webapps` creates `WebApp`, default `Environment`, `Instance`, and initial `Deployment(status=pending)` in one transaction.
2. `POST /deployments/:deploymentId/start` transitions deployment to provisioning (guarded lock).
3. Resolve region AMI from SSM public parameter.
4. Launch EC2 instance.
5. Wait for running state and fetch public IP.
6. Update records + logs and finalize deployment status.

### Deployment State Machine

Main transitions:

- `pending -> provisioning -> deploying -> active`
- Any runtime failure after lifecycle lock:
  - `* -> failed`

Concurrency guard:

- Start endpoint only transitions from startable states.
- Non-startable states return `409 Conflict`.

## 7. AWS Credential Strategy

- Local dev: can use env keys.
- Production: do not store static AWS keys.
- Preferred: attach IAM role to compute host (EC2/ECS) and let SDK default provider chain resolve credentials.

## 8. API Routes With Payloads

Base URL: `http://localhost:5000`

Authentication is cookie-based (`credentials: include` on frontend).

### 8.1 Health

`GET /health`

Response:

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": { "status": "OK" }
}
```

### 8.2 Auth

`POST /auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Registered successfully. Verify OTP sent to email.",
  "data": { "email": "user@example.com", "otpRequired": true }
}
```

`POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "githubId": null,
      "githubUsername": null
    }
  }
}
```

`POST /auth/verify-otp`

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

`POST /auth/resend-otp`

Request:

```json
{
  "email": "user@example.com"
}
```

`POST /auth/logout` (no body)

`GET /auth/me` (auth required)

### 8.3 GitHub

All routes below require auth.

`GET /git/github/oauth/url`

Response:

```json
{
  "success": true,
  "message": "GitHub OAuth URL generated successfully",
  "data": { "url": "https://github.com/login/oauth/authorize?..." }
}
```

`GET /git/github/callback?code=...`

- Exchanges GitHub code and redirects to frontend with query params.

`GET /git/github/orgs`

`GET /git/github/repos?org=<orgLogin>`

`GET /git/github/branches?owner=<owner>&repo=<repo>`

### 8.4 Metadata and Plans

`GET /metadata`

Response:

```json
{
  "regions": [{ "id": "ap-south-1", "name": "Mumbai", "country": "IN" }],
  "frameworks": [{ "id": "react", "name": "React" }],
  "databaseTypes": [{ "id": "postgresql", "name": "PostgreSQL" }]
}
```

`GET /plans`

Response:

```json
[
  {
    "id": "starter",
    "name": "Starter",
    "storage": "10 GB",
    "bandwidth": "10 GB",
    "memory": "1024 MB",
    "cpu": "1 vCPU",
    "monthlyCost": "$0",
    "pricePerHour": "$0",
    "description": "Ideal for personal blogs and small websites"
  }
]
```

### 8.5 WebApps

All routes below require auth.

`POST /webapps`

Request:

```json
{
  "name": "my-app",
  "region": "ap-south-1",
  "plan": "starter",
  "framework": "react",
  "repository": {
    "provider": "github",
    "owner": "octocat",
    "repo": "my-repo",
    "branch": "main"
  },
  "port": 3000,
  "envVars": [{ "key": "NODE_ENV", "value": "production" }]
}
```

Response:

```json
{
  "webAppId": "uuid",
  "deploymentId": "uuid",
  "status": "pending"
}
```

`GET /webapps`

`GET /webapps/:id`

### 8.6 Deployments

All routes below require auth.

`POST /deployments/:deploymentId/start`

Request (optional body):

```json
{}
```

Optional override shape:

```json
{
  "awsCredentials": {
    "accessKeyId": "optional",
    "secretAccessKey": "optional",
    "region": "ap-south-1"
  }
}
```

Response:

```json
{
  "publicIp": "x.x.x.x",
  "status": "active"
}
```

`GET /deployments/:id`

Response:

```json
{
  "status": "deploying",
  "startedAt": "2026-02-15T00:00:00.000Z",
  "finishedAt": null
}
```

`GET /deployments/:id/logs`

Response:

```json
[
  {
    "id": "uuid",
    "deploymentId": "uuid",
    "level": "info",
    "message": "Resolving AMI...",
    "createdAt": "2026-02-15T00:00:00.000Z"
  }
]
```

## 9. Route Summary Table

| Method | Path                               | Auth | Purpose                             |
| ------ | ---------------------------------- | ---- | ----------------------------------- |
| GET    | `/health`                          | No   | Service health                      |
| POST   | `/auth/register`                   | No   | Register user                       |
| POST   | `/auth/login`                      | No   | Login and set cookie                |
| POST   | `/auth/verify-otp`                 | No   | Verify email OTP                    |
| POST   | `/auth/resend-otp`                 | No   | Resend OTP                          |
| POST   | `/auth/logout`                     | No   | Clear auth cookie                   |
| GET    | `/auth/me`                         | Yes  | Current user                        |
| GET    | `/git/github/oauth/url`            | Yes  | Get GitHub OAuth URL                |
| GET    | `/git/github/callback`             | Yes  | OAuth callback exchange             |
| GET    | `/git/github/orgs`                 | Yes  | List organizations                  |
| GET    | `/git/github/repos`                | Yes  | List repositories                   |
| GET    | `/git/github/branches`             | Yes  | List branches                       |
| GET    | `/metadata`                        | No   | Regions/framework/database metadata |
| GET    | `/plans`                           | No   | Pricing and compute plans           |
| POST   | `/webapps`                         | Yes  | Create app + initial deployment     |
| GET    | `/webapps`                         | Yes  | List webapps                        |
| GET    | `/webapps/:id`                     | Yes  | Get webapp detail                   |
| POST   | `/deployments/:deploymentId/start` | Yes  | Start provisioning                  |
| GET    | `/deployments/:id`                 | Yes  | Deployment status                   |
| GET    | `/deployments/:id/logs`            | Yes  | Deployment logs                     |

## 10. Scripts

- `npm run dev` - start dev server
- `npm run build` - compile TypeScript
- `npm start` - run compiled server
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run migration in dev
- `npm run prisma:studio` - open Prisma Studio
- `npm run lint` - lint backend source

## 11. Husky and Pre-commit Quality Checks

This backend includes Husky and lint-staged for local commit-time quality checks.

### What is configured

- `prepare` script runs `husky install`.
- `lint-staged` is configured in `package.json`:
  - `src/**/*.{ts,tsx}` -> `eslint --fix` and `prettier --write`

### Setup

After install, initialize hooks automatically:

```bash
npm install
```

If hooks are missing, run:

```bash
npm run prepare
```

### Expected behavior

On `git commit`, staged TypeScript files are auto-linted and formatted before commit finalization.

## 12. Production Notes

- Use managed Postgres.
- Use IAM role instead of static AWS keys.
- Keep `JWT_SECRET` strong and private.
- Restrict CORS to exact frontend URL.
- Run migrations in deployment pipeline before app startup.

## 13. Estimated Time

- Frontend: 7-8 hours
- Backend: 12-14 hours
- Deployment/Infra: 4-5 hours
- Documentation + Testing: 3-4 hours
