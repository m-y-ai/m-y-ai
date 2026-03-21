import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AGENTS_DIR = path.join(__dirname, '..', 'storage', 'Agents')

/**
 * Load a single agent config from storage/Agents/{agentId}/
 * Reads IDENTITY.md, SOUL.md, TOOLS.md
 */
export function loadAgentConfig(agentId) {
  const agentDir = path.join(AGENTS_DIR, agentId)
  if (!fs.existsSync(agentDir)) return null

  const readFile = (name) => {
    const p = path.join(agentDir, name)
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').trim() : ''
  }

  const identity = readFile('IDENTITY.md')
  const soul = readFile('SOUL.md')
  const tools = readFile('TOOLS.md')

  // Parse display name from first # heading in IDENTITY.md
  const nameMatch = identity.match(/^#\s+(.+)$/m)
  const name = nameMatch ? nameMatch[1].trim() : agentId

  // Parse description from first non-heading paragraph
  const descMatch = identity.replace(/^#.+$/m, '').match(/^(.+?)$/m)
  const description = descMatch ? descMatch[1].trim() : ''

  return {
    id: agentId,
    name,
    description,
    identity,
    soul,
    tools,
    dir: agentDir
  }
}

/**
 * List all agents from storage/Agents/
 * Each subdirectory is an agent
 */
export function listAgents() {
  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true })
    return []
  }

  return fs.readdirSync(AGENTS_DIR)
    .filter(name => {
      try {
        return fs.statSync(path.join(AGENTS_DIR, name)).isDirectory()
      } catch {
        return false
      }
    })
    .map(id => loadAgentConfig(id))
    .filter(Boolean)
}

/**
 * Create a new agent directory with template files
 */
export function createAgent(agentId, { name, description = '', identity = '', soul = '', tools = '' } = {}) {
  const agentDir = path.join(AGENTS_DIR, agentId)
  fs.mkdirSync(agentDir, { recursive: true })

  const defaultIdentity = identity || `# ${name || agentId}

${description || `You are ${name || agentId}, an AI assistant.`}
`

  fs.writeFileSync(path.join(agentDir, 'IDENTITY.md'), defaultIdentity)
  fs.writeFileSync(path.join(agentDir, 'SOUL.md'), soul || '')
  fs.writeFileSync(path.join(agentDir, 'TOOLS.md'), tools || '')

  return loadAgentConfig(agentId)
}

export default { loadAgentConfig, listAgents, createAgent }
