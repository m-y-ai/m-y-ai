const parseList = (env) => env ? env.split(',').map(s => s.trim()).filter(Boolean) : []

export default {
    agentId: 'm-y-ai',

    whatsapp: {
        enabled: true,
        allowedDMs: parseList(process.env.WHATSAPP_ALLOWED_DMS),       // phone numbers, or '*' for all
        allowedGroups: parseList(process.env.WHATSAPP_ALLOWED_GROUPS),  // group JIDs
        respondToMentionsOnly: true
    },

    imessage: {
        enabled: false,
        allowedDMs: parseList(process.env.IMESSAGE_ALLOWED_DMS),       // chat IDs, or '*' for all
        allowedGroups: parseList(process.env.IMESSAGE_ALLOWED_GROUPS),
        respondToMentionsOnly: true
    },

    telegram: {
        enabled: true,
        token: process.env.TELEGRAM_BOT_TOKEN || '',
        allowedDMs: parseList(process.env.TELEGRAM_ALLOWED_DMS),       // user IDs, or '*' for all
        allowedGroups: parseList(process.env.TELEGRAM_ALLOWED_GROUPS),
        respondToMentionsOnly: true
    },

    signal: {
        enabled: false,
        phoneNumber: process.env.SIGNAL_PHONE_NUMBER || '',
        signalCliPath: 'signal-cli',
        allowedDMs: parseList(process.env.SIGNAL_ALLOWED_DMS),         // phone numbers, or '*' for all
        allowedGroups: parseList(process.env.SIGNAL_ALLOWED_GROUPS),
        respondToMentionsOnly: true
    },

    web: {
        enabled: process.env.WEB_ENABLED === 'true',
        port: parseInt(process.env.WEB_PORT || '2701', 10),
        apiKey: process.env.WEB_API_KEY || '',                   // optional; clients send as X-Api-Key
        allowedOrigins: parseList(process.env.WEB_ALLOWED_ORIGINS) || ['*'],
        allowedDMs: parseList(process.env.WEB_ALLOWED_DMS) || ['*'],  // chatIds or '*'
        allowedGroups: []
    },

    mobileApp: {
        enabled: process.env.MOBILE_APP_ENABLED === 'true',
        port: parseInt(process.env.MOBILE_APP_PORT || '2702', 10),
        apiKey: process.env.MOBILE_APP_API_KEY || '',            // required for mobile auth
        allowedDMs: parseList(process.env.MOBILE_APP_ALLOWED_DEVICES) || ['*'],  // deviceIds or '*'
        allowedGroups: [],
        heartbeatMs: parseInt(process.env.MOBILE_APP_HEARTBEAT_MS || '20000', 10)
    },

    // Agent configuration
    agent: {
        workspace: '~/m-y-ai',                  // Agent workspace directory
        maxTurns: 100,                // Max tool-use turns per message
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        provider: 'claude',          // 'claude' or 'opencode'
        opencode: {
            model: 'opencode/gpt-5-nano',
            hostname: '127.0.0.1',
            port: 2704
        }
    }
}
