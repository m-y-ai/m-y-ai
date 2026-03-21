#!/bin/bash
set -e

SEED_DIR="/app/storage-seed"
HOME_DIR="/home/m-y-ai"
SENTINEL="${HOME_DIR}/.initialized"

# ── Parse flags ──────────────────────────────────────────────────────────────
# Supported: --install-all  --install-pip  --install-npm  --install-ubuntu
#            --skip-install (skip dependency install even on first run)
INSTALL_ALL=false
INSTALL_PIP=false
INSTALL_NPM=false
INSTALL_UBUNTU=false
SKIP_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --install-all)    INSTALL_ALL=true ;;
    --install-pip)    INSTALL_PIP=true ;;
    --install-npm)    INSTALL_NPM=true ;;
    --install-ubuntu) INSTALL_UBUNTU=true ;;
    --skip-install)   SKIP_INSTALL=true ;;
  esac
done

# ── First-run seed ───────────────────────────────────────────────────────────
if [ ! -f "$SENTINEL" ]; then
  echo "[entrypoint] First run — seeding home directory from image defaults..."
  cp -r --no-clobber "${SEED_DIR}/." "${HOME_DIR}/"
  touch "$SENTINEL"
  echo "[entrypoint] Seed complete."

  # On first run, install all dependencies unless explicitly skipped
  if [ "$SKIP_INSTALL" = "false" ]; then
    INSTALL_ALL=true
  fi
else
  echo "[entrypoint] Home already initialized — skipping seed."
fi

# ── Dependency install ───────────────────────────────────────────────────────
if [ "$SKIP_INSTALL" = "false" ]; then
  # Build the flags string for the Node installer
  INSTALL_FLAGS=""
  if   [ "$INSTALL_ALL"    = "true" ]; then INSTALL_FLAGS="--all"
  elif [ "$INSTALL_PIP"    = "true" ] || [ "$INSTALL_NPM" = "true" ] || [ "$INSTALL_UBUNTU" = "true" ]; then
    [ "$INSTALL_PIP"    = "true" ] && INSTALL_FLAGS="$INSTALL_FLAGS --pip"
    [ "$INSTALL_NPM"    = "true" ] && INSTALL_FLAGS="$INSTALL_FLAGS --npm"
    [ "$INSTALL_UBUNTU" = "true" ] && INSTALL_FLAGS="$INSTALL_FLAGS --ubuntu"
  fi

  if [ -n "$INSTALL_FLAGS" ]; then
    echo "[entrypoint] Installing system dependencies ($INSTALL_FLAGS)..."
    # shellcheck disable=SC2086
    node /app/backend/tools/install.js $INSTALL_FLAGS || {
      echo "[entrypoint] WARNING: dependency install failed (non-fatal, continuing)"
    }
  fi
fi

exec node backend/gateway.js
