# NPM Global Packages
#
# Format: one package per line, optionally pinned with @version
# Lines starting with # are comments and are ignored.
# Blank lines are ignored.
#
# These are installed globally (npm install -g).
# Installed automatically on container start.
# Trigger manually: POST /api/install  { "type": "npm" }
#                   /install npm       (slash command)
#                   node backend/tools/install.js --npm

# ── CLI Tools ──────────────────────────────────────────────
tsx
ts-node
typescript
nodemon
pm2

# ── Package Managers / Runtimes ────────────────────────────
bun
pnpm

# ── Build Tools ────────────────────────────────────────────
turbo
vite
esbuild

# ── Code Quality ───────────────────────────────────────────
eslint
prettier
depcheck

# ── Testing ────────────────────────────────────────────────
vitest
jest

# ── API / HTTP ─────────────────────────────────────────────
http-server
serve
localtunnel
