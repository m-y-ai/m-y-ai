#!/usr/bin/env node
/**
 * Dependency installer for m-y-ai
 *
 * Reads package lists from backend/storage/System/*.md and installs them.
 * Works as both an imported module and a standalone CLI.
 *
 * CLI usage:
 *   node backend/tools/install.js --all
 *   node backend/tools/install.js --pip --npm
 *   node backend/tools/install.js --ubuntu
 *   node backend/tools/install.js --pip --packages "requests,flask"  (override list)
 *
 * Module usage:
 *   import { installDeps } from './tools/install.js'
 *   const result = await installDeps({ pip: true, npm: false, ubuntu: true })
 */

import { readFileSync, existsSync } from 'fs'
import { spawnSync, spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

/** Use sudo when not running as root (uid > 0) */
const SUDO = process.getuid?.() !== 0 ? ['sudo'] : []

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const STORAGE_DIR = resolve(__dirname, '../storage/System')

const MD_FILES = {
  pip: join(STORAGE_DIR, 'PIP_PACKAGES.md'),
  npm: join(STORAGE_DIR, 'NPM_PACKAGES.md'),
  ubuntu: join(STORAGE_DIR, 'UBUNTU_PACKAGES.md'),
}

/**
 * Parse a package list from an MD file.
 * - Strips comment lines (# ...)
 * - Strips inline comments (everything after the first #)
 * - Strips blank lines
 * - Returns a deduplicated array of package names/specs
 *
 * @param {string} filePath
 * @returns {string[]}
 */
function parsePackages(filePath) {
  if (!existsSync(filePath)) return []
  const raw = readFileSync(filePath, 'utf8')
  return raw
    .split('\n')
    .map(line => line.split('#')[0].trim())   // strip inline comments
    .filter(line => line.length > 0)          // drop blank / comment-only lines
    .filter((pkg, idx, arr) => arr.indexOf(pkg) === idx) // deduplicate
}

/**
 * Run a shell command, streaming stdout/stderr to the caller's process.
 * Returns { code, stdout, stderr }.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} opts
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
function runCommand(cmd, args, opts = {}) {
  return new Promise((resolvePromise) => {
    const chunks = { stdout: [], stderr: [] }
    const proc = spawn(cmd, args, {
      stdio: opts.silent ? 'pipe' : 'inherit',
      shell: false,
      ...opts.spawnOpts,
    })

    if (opts.silent) {
      proc.stdout?.on('data', d => chunks.stdout.push(d))
      proc.stderr?.on('data', d => chunks.stderr.push(d))
    }

    proc.on('close', code => {
      resolvePromise({
        code: code ?? 1,
        stdout: Buffer.concat(chunks.stdout).toString(),
        stderr: Buffer.concat(chunks.stderr).toString(),
      })
    })

    proc.on('error', err => {
      resolvePromise({ code: 1, stdout: '', stderr: err.message })
    })
  })
}

/**
 * Install pip packages.
 *
 * @param {string[]|null} overridePackages  If provided, install these instead of reading the MD file.
 * @param {boolean} silent                  Suppress stdout/stderr passthrough (for API calls).
 * @returns {Promise<{ ok: boolean, installed: string[], error?: string }>}
 */
async function installPip(overridePackages = null, silent = false) {
  const packages = overridePackages ?? parsePackages(MD_FILES.pip)
  if (packages.length === 0) return { ok: true, installed: [] }

  // Prefer pip3, fall back to pip; prefix with sudo when non-root
  const pipBin = spawnSync('which', ['pip3']).status === 0 ? 'pip3' : 'pip'
  const [cmd, ...prefix] = [...SUDO, pipBin]

  if (!silent) console.log(`[install] pip: installing ${packages.length} packages…`)

  const result = await runCommand(cmd, [...prefix, 'install', '--quiet', '--upgrade', ...packages], { silent })

  if (result.code !== 0) {
    return { ok: false, installed: [], error: result.stderr || `pip exited ${result.code}` }
  }

  if (!silent) console.log(`[install] pip: done`)
  return { ok: true, installed: packages }
}

/**
 * Install npm global packages.
 *
 * @param {string[]|null} overridePackages
 * @param {boolean} silent
 * @returns {Promise<{ ok: boolean, installed: string[], error?: string }>}
 */
async function installNpm(overridePackages = null, silent = false) {
  const packages = overridePackages ?? parsePackages(MD_FILES.npm)
  if (packages.length === 0) return { ok: true, installed: [] }

  if (!silent) console.log(`[install] npm: installing ${packages.length} packages globally…`)

  const result = await runCommand('npm', ['install', '-g', '--quiet', ...packages], { silent })

  if (result.code !== 0) {
    return { ok: false, installed: [], error: result.stderr || `npm exited ${result.code}` }
  }

  if (!silent) console.log(`[install] npm: done`)
  return { ok: true, installed: packages }
}

/**
 * Install ubuntu/apt packages.
 *
 * @param {string[]|null} overridePackages
 * @param {boolean} silent
 * @returns {Promise<{ ok: boolean, installed: string[], error?: string }>}
 */
async function installUbuntu(overridePackages = null, silent = false) {
  const packages = overridePackages ?? parsePackages(MD_FILES.ubuntu)
  if (packages.length === 0) return { ok: true, installed: [] }

  if (!silent) console.log(`[install] apt: updating package index…`)

  const [aptCmd, ...aptPrefix] = [...SUDO, 'apt-get']

  const update = await runCommand(aptCmd, [...aptPrefix, 'update', '-qq'], { silent })
  if (update.code !== 0) {
    return { ok: false, installed: [], error: update.stderr || `apt-get update exited ${update.code}` }
  }

  if (!silent) console.log(`[install] apt: installing ${packages.length} packages…`)

  const result = await runCommand(
    aptCmd,
    [...aptPrefix, 'install', '-y', '--no-install-recommends', ...packages],
    {
      silent,
      spawnOpts: { env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' } },
    }
  )

  if (result.code !== 0) {
    return { ok: false, installed: [], error: result.stderr || `apt-get exited ${result.code}` }
  }

  if (!silent) console.log(`[install] apt: done`)
  return { ok: true, installed: packages }
}

/**
 * High-level entry point.
 *
 * @param {{
 *   pip?: boolean,
 *   npm?: boolean,
 *   ubuntu?: boolean,
 *   all?: boolean,
 *   overrides?: { pip?: string[], npm?: string[], ubuntu?: string[] },
 *   silent?: boolean
 * }} opts
 * @returns {Promise<{ pip?: object, npm?: object, ubuntu?: object }>}
 */
export async function installDeps(opts = {}) {
  const { all = false, silent = false, overrides = {} } = opts
  const doPip = all || opts.pip
  const doNpm = all || opts.npm
  const doUbuntu = all || opts.ubuntu

  const results = {}

  if (doPip) results.pip = await installPip(overrides.pip ?? null, silent)
  if (doNpm) results.npm = await installNpm(overrides.npm ?? null, silent)
  if (doUbuntu) results.ubuntu = await installUbuntu(overrides.ubuntu ?? null, silent)

  return results
}

/**
 * Return the parsed package list without installing anything.
 *
 * @param {'pip'|'npm'|'ubuntu'} type
 * @returns {string[]}
 */
export function listPackages(type) {
  return parsePackages(MD_FILES[type] ?? '')
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2)

  const opts = {
    all: args.includes('--all'),
    pip: args.includes('--pip'),
    npm: args.includes('--npm'),
    ubuntu: args.includes('--ubuntu'),
    silent: args.includes('--silent'),
    overrides: {},
  }

  // --packages "pkg1,pkg2" applies to the first explicit type flag
  const pkgIdx = args.indexOf('--packages')
  if (pkgIdx !== -1 && args[pkgIdx + 1]) {
    const pkgList = args[pkgIdx + 1].split(',').map(p => p.trim()).filter(Boolean)
    if (opts.pip) opts.overrides.pip = pkgList
    else if (opts.npm) opts.overrides.npm = pkgList
    else if (opts.ubuntu) opts.overrides.ubuntu = pkgList
  }

  if (!opts.all && !opts.pip && !opts.npm && !opts.ubuntu) {
    console.log(`Usage: node backend/tools/install.js [--all] [--pip] [--npm] [--ubuntu]
                                   [--packages "pkg1,pkg2"] [--silent]

Options:
  --all        Install all package types
  --pip        Install pip packages from PIP_PACKAGES.md
  --npm        Install npm global packages from NPM_PACKAGES.md
  --ubuntu     Install apt packages from UBUNTU_PACKAGES.md
  --packages   Comma-separated override list (applies to the first type flag)
  --silent     Suppress stdout/stderr passthrough (JSON output only)

Examples:
  node backend/tools/install.js --all
  node backend/tools/install.js --pip --npm
  node backend/tools/install.js --pip --packages "requests,flask,pandas"
`)
    process.exit(0)
  }

  installDeps(opts)
    .then(results => {
      if (opts.silent) {
        process.stdout.write(JSON.stringify(results, null, 2) + '\n')
      } else {
        const failed = Object.entries(results).filter(([, r]) => !r.ok)
        if (failed.length) {
          console.error('[install] Some installs failed:')
          failed.forEach(([type, r]) => console.error(`  ${type}: ${r.error}`))
          process.exit(1)
        }
        console.log('[install] All done.')
      }
    })
    .catch(err => {
      console.error('[install] Fatal:', err.message)
      process.exit(1)
    })
}
