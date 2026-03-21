# Ubuntu (apt) Packages
#
# Format: one package per line
# Lines starting with # are comments and are ignored.
# Blank lines are ignored.
#
# Installed automatically on container start.
# Trigger manually: POST /api/install  { "type": "ubuntu" }
#                   /install ubuntu    (slash command)
#                   node backend/tools/install.js --ubuntu

# ── Shell & Core Utils ────────────────────────────────────
bash
curl
wget
git
jq
unzip
zip
tar
rsync
tree
htop
vim
nano
less

# ── Build Tools ───────────────────────────────────────────
build-essential
make
cmake
gcc
g++
pkg-config

# ── Python ────────────────────────────────────────────────
python3
python3-pip
python3-venv
python3-dev

# ── Network / SSL ─────────────────────────────────────────
ca-certificates
openssl
net-tools
iputils-ping
dnsutils
netcat-openbsd

# ── Database Clients ──────────────────────────────────────
postgresql-client
redis-tools
sqlite3

# ── Media / Docs ──────────────────────────────────────────
ffmpeg
imagemagick
ghostscript

# ── Misc Dev Tools ────────────────────────────────────────
gnupg
sudo
procps
lsof
strace
