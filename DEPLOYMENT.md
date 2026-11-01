# Deploying Tauche

This guide covers everything needed to run Tauche in production (and in
staging/dev parity). Tauche is a **single Spring Boot JAR** (which also
serves the built React frontend) plus a **PostgreSQL 15** database plus a
local **uploads directory** for images. There is no separate frontend host in
the supported deployment.

> Companion files: `Dockerfile`, `docker-compose.yml`, `.env.example`,
> `render.yaml`. Read `README.md` for product/feature overview.

---

## 1. Architecture at a glance

```
┌──────────────────────┐        ┌──────────────────────┐
│  Browser             │  HTTPS │  Reverse proxy       │
│  (React SPA)         │───────▶│  (Nginx/Caddy/...)   │
└──────────────────────┘        └──────────┬───────────┘
                                          │ HTTP
                             ┌────────────▼────────────┐
                             │  Tauche app (JAR)       │
                             │  Spring Boot :8080      │
                             │  serves /api, /uploads, │
                             │  and the SPA (index.html)│
                             └────┬───────────────┬────┘
                                  │ JDBC          │ file I/O
                       ┌──────────▼──────┐  ┌─────▼──────┐
                       │ PostgreSQL 15   │  │ /app/uploads│
                       └─────────────────┘  └────────────┘
```

Key implications:

- **One origin is the supported shape.** The frontend's API client talks to
  the same origin in production (`baseURL = ''` → `/api`). If you split
  frontend and backend onto different hosts you must add a reverse proxy or
  edit `frontend/src/api/diveApi.js`.
- **Images live on local disk**, not in the database. The DB stores only
  `/uploads/<uuid>.ext` paths. You must back up the uploads volume together
  with the database or images will be orphaned.
- **Stateful in-memory bits:** the JWT logout blacklist and the rate limiter
  are per JVM. Run **one app instance** unless you add shared storage/Redis.
- **No health actuator is shipped.** Use `GET /api/config` (returns
  `{"BACKEND_PORT":"..."}`) or `GET /` for liveness.

---

## 2. Prerequisites

| Component | Version | Notes |
|---|---|---|
| Docker + Compose | Docker 20.10+, Compose v2 | Recommended path |
| Java | 21+ | Only for manual builds |
| Node.js | 20+ | Only for manual frontend builds |
| Maven | 3.9+ (wrapper included) | `./mvnw` |
| PostgreSQL | 15+ | Managed or container |
| Reverse proxy | Nginx/Caddy/Traefik | For HTTPS in production |

---

## 3. Quick start (Docker Compose) — recommended

Verified end-to-end. From a clean checkout:

```bash
git clone git@github.com:Swissschoggi/Tauche.git
cd Tauche

# 1. Configure
cp .env.example .env
$EDITOR .env            # at minimum set JWT_SECRET, passwords

# 2. Create the uploads dir owned by the container's app user (uid 100)
mkdir -p uploads
sudo chown -R 100:101 uploads

# 3. Start
docker compose up -d

# 4. Verify
curl -sS http://localhost:8989/api/config
# -> {"BACKEND_PORT":"8080"}
```

The app listens on **host port 8989** (container port 8080). PostgreSQL is on
host port `${POSTGRES_PORT}` (default `5432`, but `.env.example` sets
`5443`).

### 3.1 Building your own image (instead of pulling `swissschoggi/tauche:latest`)

`docker-compose.yml` references a prebuilt image. If you changed code, build
locally and override:

```bash
docker build -t tauche:local .

# Option A: edit docker-compose.yml -> image: tauche:local
# Option B: create docker-compose.override.yml
cat > docker-compose.override.yml <<'EOF'
services:
  app:
    image: tauche:local
EOF

docker compose up -d --build
```

The `Dockerfile` is a 3-stage build (Node frontend → Maven backend → JRE
runtime) and bakes the frontend into the JAR, so no separate frontend deploy
is needed.

### 3.2 Stopping / logs

```bash
docker compose logs -f app
docker compose ps
docker compose down          # keep volumes
docker compose down -v       # WARNING: deletes postgres_data volume
```

---

## 4. Environment variables

### 4.1 Required (app will not start without these)

| Variable | Example | Notes |
|---|---|---|
| `JWT_SECRET` | `openssl rand -hex 64` output | **Hex string**, ≥ 64 hex chars (32 bytes). Used for HS256. Missing/short → `PlaceholderResolutionException` / `WeakKeyException` at startup. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/divelog_db` | JDBC URL. |
| `SPRING_DATASOURCE_USERNAME` | `dive_master` | |
| `SPRING_DATASOURCE_PASSWORD` | (secret) | |

### 4.2 Application / security

| Variable | Default | Notes |
|---|---|---|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins. In single-host Docker deployments the request's own origin is also auto-allowed, so this is mainly for split-host setups. |
| `ADMIN_EMAIL` | (empty) | If set together with `ADMIN_PASSWORD`, an admin account is created on first startup if it does not yet exist. |
| `ADMIN_PASSWORD` | (empty) | Stored with BCrypt. No complexity check is applied at bootstrap (registration rules do not apply). |
| `RESET_ADMIN_PASSWORD` | (empty) | If set, resets the password of the hardcoded account `fynn.gaechter@gmail.com`. Remove after use. |
| `PORT` | `8080` | Spring Boot listen port. Render/Heroku set this automatically. |
| `BACKEND_PORT` | `8080` | Only feeds the `/api/config` response; keep in sync with `PORT`. |
| `SERVER_ADDRESS` | — | Present in `.env.example` but **not consumed** by the app (the app always binds `0.0.0.0`). Reserved/unused. |

### 4.3 Docker Compose / Postgres (used by `docker-compose.yml`)

| Variable | Default (compose) | Notes |
|---|---|---|
| `POSTGRES_USER` | `dive_master` | |
| `POSTGRES_PASSWORD` | `secure_reef_password` | **Change in production.** |
| `POSTGRES_DB` | `divelog_db` | |
| `POSTGRES_PORT` | `5432` | Host-side port mapping. `.env.example` ships `5443` to avoid clashing with a local Postgres. |

### 4.4 Frontend build-time (Vite)

These are baked into the JS bundle at `npm run build`. They are **not**
runtime env vars.

Note: `frontend/.env.example` ships `VITE_API_BASE_URL`, but the current
client (`frontend/src/api/diveApi.js`) does **not** read it — in dev it
always targets `http://localhost:8080`, and in prod it uses the same
origin. Only `VITE_GOOGLE_MAPS_API_KEY` is actually consumed.

| Variable | Where to set | Notes |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | `frontend/.env` (dev) or Docker build arg | Optional. Enables Google satellite tiles on the map page. If unset, a free (no-key) Esri satellite provider is used. |

To pass it through the Docker build, patch the `frontend-build` stage of the
`Dockerfile`:

```dockerfile
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build
```

then build with:

```bash
docker build --build-arg VITE_GOOGLE_MAPS_API_KEY=your_key -t tauche:local .
```

### 4.5 Generating a valid JWT secret

```bash
# Minimum (32 bytes / 64 hex chars)
openssl rand -hex 32

# Recommended (64 bytes / 128 hex chars, matches .env.example)
openssl rand -hex 64
```

The value must be **hexadecimal** because `JwtService` decodes it with
`hexToBytes`. A random base64/ASCII string will fail at signing time.

---

## 5. Database & migrations

- Hibernate runs with `spring.jpa.hibernate.ddl-auto=update`, so tables and
  columns are created/extended automatically on startup. No migration runner
  (Flyway/Liquibase) is configured.
- Reference SQL lives in `src/main/resources/db/migration/`
  (`V1__create_base_tables.sql`, `V2__create_certifications_and_trips_tables.sql`,
  `V3__add_diver_columns.sql`). These are **not** applied automatically.
- For a brand-new database the app starts cleanly with `ddl-auto=update`.
- For upgrading an older instance, apply the missing files manually if
  Hibernate did not add a column/constraint you need:

```bash
# From the host, against the compose Postgres:
docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < src/main/resources/db/migration/V3__add_diver_columns.sql
```

Notes:

- `V2__...sql` uses plain `CREATE TABLE` (no `IF NOT EXISTS`); running it
  twice will error. Only run on databases where those tables are absent.
- `V1`/`V2` create indexes; Hibernate's `update` does not always create
  indexes, so apply them manually if you rely on query performance.
- Production hardening: after the schema is stable you may set
  `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` (or `none`) and manage schema via
  the SQL files. Leaving `update` is acceptable for this app but can mask
  drift.

---

## 6. Persistence & volumes

### 6.1 PostgreSQL

Compose declares a named volume `postgres_data`. Back up with:

```bash
# Logical dump
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  > "tauche-$(date +%F).sql"

# Restore
docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < tauche-2026-01-01.sql
```

### 6.2 Uploads

- Container path: `/app/uploads` (see `WebConfig` → `file:///app/uploads/`).
- `FileService` writes to `uploads/` relative to the **process working
  directory**; in the container the working directory is `/app`, so the two
  agree. **Run the JAR from `/app` in manual deployments** (see §7).
- Limits: 10 MB per file and per request; allowed types `jpg/jpeg/png/gif/webp`,
  validated by MIME type **and** magic bytes.
- Permission: files are written by uid `100` / gid `101` (`app` user). The bind
  mount host directory must be writable by that uid (§3).
- Back up together with the DB:

```bash
tar czf "uploads-$(date +%F).tar.gz" uploads/
```

### 6.3 Bind-mount permission (common failure)

Docker creates a missing host bind-mount directory as `root:root`, which the
container's `app` user cannot write to → uploads return HTTP 500 with
`AccessDeniedException: /app/uploads/...`.

Fix:

```bash
mkdir -p uploads
sudo chown -R 100:101 uploads
# or, if you do not have sudo, run the chown as root on the host
```

Alternatively switch `docker-compose.yml` to a **named volume** (no host
permission dance, but harder to back up):

```yaml
services:
  app:
    volumes:
      - uploads_data:/app/uploads
volumes:
  uploads_data:
```

---

## 7. Manual (non-Docker) deployment

```bash
# 1. Frontend
cd frontend
npm ci
npm run build          # writes dist/ and strips crossorigin attr
cd ..

# 2. Bake frontend into Spring resources
rm -rf src/main/resources/static
mkdir -p src/main/resources/static
cp -r frontend/dist/* src/main/resources/static/

# 3. Backend
./mvnw clean package -DskipTests
# -> target/tauche-0.0.1-SNAPSHOT.jar

# 4. Database: create user/db in Postgres 15 (see §5)

# 5. Run from /app so uploads path matches WebConfig
sudo mkdir -p /app/tauche /app/uploads
sudo chown -R 100:101 /app/uploads
sudo cp target/tauche-0.0.1-SNAPSHOT.jar /app/tauche/app.jar

cd /app
export JWT_SECRET="$(openssl rand -hex 64)"
export SPRING_DATASOURCE_URL="jdbc:postgresql://127.0.0.1:5432/divelog_db"
export SPRING_DATASOURCE_USERNAME="dive_master"
export SPRING_DATASOURCE_PASSWORD="change-me"
export ALLOWED_ORIGINS="https://tauche.example.com"
java -jar /app/tauche/app.jar
```

Notes:

- `application.properties` sets `server.address=0.0.0.0`, so the app is
  reachable on all interfaces.
- The JAR is executable; `java -jar` is enough (no Tomcat install).
- If you run as a systemd service, set `WorkingDirectory=/app`.
- Java 21 is required (Spring Boot 4.0.6 / Temurin).

---

## 8. Reverse proxy & HTTPS

Terminate TLS in front of the app. The app itself speaks plain HTTP.

### 8.1 Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name tauche.example.com;

    ssl_certificate     /etc/letsencrypt/live/tauche.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tauche.example.com/privkey.pem;

    client_max_body_size 12m;   # > 10 MB upload limit

    location / {
        proxy_pass         http://127.0.0.1:8989;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name tauche.example.com;
    return 301 https://$host$request_uri;
}
```

Caveats:

- `client_max_body_size` must exceed Spring's 10 MB or uploads fail with 413.
- Do **not** strip the `Authorization` header; the app needs it for JWT.
- The app's CSP/HSTS headers are already set by Spring Security; the proxy
  should not override them unless you know what you are doing.

### 8.2 Caddy (minimal)

```caddy
tauche.example.com {
    reverse_proxy 127.0.0.1:8989
}
```

Caddy handles TLS automatically and defaults to a generous body size.

---

## 9. Deploying to Render (or similar PaaS)

`render.yaml` is provided but **outdated** (it references a non-existent
`Dockerfile.backend` and splits frontend/backend, which the frontend's
same-origin API client does not support). Recommended approach:

1. Create a single **Web Service** from the repo using the root `Dockerfile`.
2. Add a **PostgreSQL** database; copy its connection string into
   `SPRING_DATASOURCE_URL` (JDBC form: `jdbc:postgresql://host:port/db`).
3. Set env vars: `JWT_SECRET` (Render can generate), `SPRING_DATASOURCE_*`,
   `ALLOWED_ORIGINS` (your Render URL), optionally `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`.
4. The app honors `PORT` automatically.
5. For uploads: Render's filesystem is ephemeral on free tiers. Either attach a
   persistent disk mounted at `/app/uploads`, or accept that images are lost on
   redeploy. The DB rows will then point at missing files.

---

## 10. Admin & first login

- Register a normal account via the UI (`/register`) — password rules:
  ≥ 8 chars, upper + lower + digit.
- To create an admin, set `ADMIN_EMAIL` + `ADMIN_PASSWORD` before first start;
  the account is bootstrapped only if it does not already exist.
- To reset the owner account password, set `RESET_ADMIN_PASSWORD` (targets
  `fynn.gaechter@gmail.com`); remove the var afterwards.
- Admin endpoints live under `/api/admin/**` and require role `ADMIN`.

---

## 11. Scaling & limitations

- **Single instance only** is supported out of the box:
  - JWT logout blacklist is in-memory (`TokenBlacklistService`).
  - Rate limiter is in-memory (`RateLimitingFilter`).
  - Uploads are local files.
- Horizontal scaling would require shared upload storage, a shared token
  blacklist (e.g. Redis), and sticky sessions or externalized rate limiting.
- The rate limiter trusts `X-Forwarded-For` only from private/loopback peers
  (see `RateLimitingFilter.isTrustedProxy`), so put the app behind a proxy on
  a private network or localhost.
- Database connection pool is Spring Boot's default HikariCP.

---

## 12. Backup & restore (full procedure)

```bash
# 1. Database
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip > "db-$(date +%F).sql.gz"

# 2. Uploads
tar czf "uploads-$(date +%F).tar.gz" uploads/

# Restore DB
gunzip -c db-2026-01-01.sql.gz \
  | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Restore uploads
tar xzf uploads-2026-01-01.tar.gz
sudo chown -R 100:101 uploads
```

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| App exits immediately: `Could not resolve placeholder 'JWT_SECRET'` | Env var not set | Set `JWT_SECRET` (hex, ≥ 64 chars). |
| `WeakKeyException` / JWT signing fails | Secret too short or not hex | Use `openssl rand -hex 32` (or 64). |
| `Connection refused` to Postgres | DB not ready / wrong host/port | Check `SPRING_DATASOURCE_URL`; ensure Postgres healthy (`docker compose ps`). |
| Upload returns 500 `AccessDeniedException: /app/uploads/...` | Host dir root-owned | `sudo chown -R 100:101 uploads` (§6.3). |
| Upload returns 413 | Proxy body limit too small | Raise `client_max_body_size` to 12m+ (§8.1). |
| Uploaded image returns 404 | CWD mismatch (manual deploy) or missing volume | Run JAR from `/app`; verify `/app/uploads` contains the file. |
| CORS error in browser | Origin not allowed | Add origin to `ALLOWED_ORIGINS`; or use same origin. |
| Images fine locally, missing after redeploy | Ephemeral filesystem (PaaS) | Attach persistent disk at `/app/uploads`. |
| Login always 401 | Wrong password / admin not bootstrapped | Check `ADMIN_EMAIL`/`ADMIN_PASSWORD`; registration requires 8+ chars with upper/lower/digit. |
| Port already in use | Another process on 8989/8080 | Change host port in compose or `PORT`. |
| Slow first request (Render free tier) | Cold start | Expected; wait ~30s. |
| Schema missing columns after upgrade | `ddl-auto=update` didn't migrate | Apply `V2`/`V3` SQL manually (§5). |

---

## 14. Security hardening checklist

- [ ] `JWT_SECRET` is 64+ hex chars, unique per environment, not committed.
- [ ] `POSTGRES_PASSWORD` changed from default.
- [ ] `.env` is in `.gitignore` (it is) and never committed.
- [ ] Postgres port not exposed publicly (remove `ports:` mapping in prod, or firewall it).
- [ ] HTTPS enforced at the proxy (HSTS is already sent by the app).
- [ ] `ADMIN_PASSWORD` strong; `RESET_ADMIN_PASSWORD` removed after use.
- [ ] Uploads directory not directly web-listable (app serves via `/uploads/**` with cache headers; no directory listing).
- [ ] Backups automated and tested.
- [ ] Dependencies updated periodically (`mvn versions:display-dependency-updates`).

---

## 15. Verification checklist (post-deploy)

```bash
# Liveness
curl -sS https://tauche.example.com/api/config

# Register + login
curl -sS -X POST https://tauche.example.com/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"SmokeTest1"}'

# Create a dive
TOKEN=$(curl -sS -X POST https://tauche.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"SmokeTest1"}' | \
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -sS -X POST https://tauche.example.com/api/dives \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"diveTitle":"Smoke","date":"2026-11-01","location":"Pool","depthMeters":5,"durationMinutes":20}'

# SPA routing
curl -sS -o /dev/null -w "%{http_code}\n" https://tauche.example.com/trips
# -> 200
```

If all pass, the deployment is healthy. Clean up the smoke-test account via the
admin dashboard or DB.
