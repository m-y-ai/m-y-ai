# Python (pip) Packages
#
# Format: one package per line, optionally pinned with ==version
# Lines starting with # are comments and are ignored.
# Blank lines are ignored.
#
# Installed automatically on container start.
# Trigger manually: POST /api/install  { "type": "pip" }
#                   /install pip       (slash command)
#                   node backend/tools/install.js --pip

# ── HTTP & Web ─────────────────────────────────────────────
requests
httpx
aiohttp
fastapi
uvicorn[standard]
flask
gunicorn

# ── Data & Serialization ───────────────────────────────────
pydantic
orjson
python-dotenv
PyYAML
toml

# ── AI / ML ────────────────────────────────────────────────
openai
anthropic
tiktoken
numpy
pandas

# ── Database ───────────────────────────────────────────────
sqlalchemy
psycopg2-binary
redis
pymongo

# ── Utilities ──────────────────────────────────────────────
rich
click
tqdm
schedule
python-dateutil
pytz

# ── Crypto / Security ──────────────────────────────────────
cryptography
PyJWT

# ── Testing ────────────────────────────────────────────────
pytest
pytest-asyncio
