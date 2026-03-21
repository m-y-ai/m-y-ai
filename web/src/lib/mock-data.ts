// Mock data for dashboard — replace with real API calls later

export interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface ChannelStatus {
  name: string;
  platform: string;
  connected: boolean;
  messagesTotal: number;
}

export interface TaskItem {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee: string;
  dueDate?: string;
}

export interface ActivityItem {
  id: string;
  type: "message" | "task" | "agent" | "system";
  description: string;
  timestamp: string;
  platform?: string;
}

export const DASHBOARD_STATS: StatCard[] = [
  { label: "Active Agents", value: "3", change: "+1 this week", trend: "up" },
  { label: "Total Tokens", value: "1.2M", change: "+340K today", trend: "up" },
  { label: "Cost (MTD)", value: "$12.40", change: "-8% vs last month", trend: "down" },
  { label: "Messages", value: "847", change: "+124 today", trend: "up" },
  { label: "Active Sessions", value: "5", change: "2 queued", trend: "neutral" },
  { label: "Skills Loaded", value: "18", change: "3 custom", trend: "neutral" },
];

export const CHANNEL_STATUSES: ChannelStatus[] = [
  { name: "WhatsApp", platform: "whatsapp", connected: true, messagesTotal: 423 },
  { name: "Telegram", platform: "telegram", connected: true, messagesTotal: 312 },
  { name: "Web", platform: "web", connected: false, messagesTotal: 0 },
  { name: "Signal", platform: "signal", connected: false, messagesTotal: 0 },
  { name: "iMessage", platform: "imessage", connected: false, messagesTotal: 112 },
  { name: "Slack", platform: "slack", connected: false, messagesTotal: 0 },
];

export const TASKS: TaskItem[] = [
  { id: "t1", title: "Implement WebSocket adapter", status: "in_progress", priority: "high", assignee: "Coder" },
  { id: "t2", title: "Add vector memory (LanceDB)", status: "todo", priority: "medium", assignee: "Researcher" },
  { id: "t3", title: "Set up web UI auth", status: "todo", priority: "high", assignee: "Coder" },
  { id: "t4", title: "Composio OAuth flow", status: "in_progress", priority: "medium", assignee: "m-y-ai" },
  { id: "t5", title: "Daily memory summarizer", status: "done", priority: "low", assignee: "Writer" },
  { id: "t6", title: "WhatsApp media support", status: "todo", priority: "medium", assignee: "m-y-ai" },
  { id: "t7", title: "Gateway health endpoint", status: "done", priority: "high", assignee: "Coder" },
  { id: "t8", title: "Telegram inline keyboard", status: "in_progress", priority: "low", assignee: "m-y-ai" },
  { id: "t9", title: "Session transcript export", status: "done", priority: "medium", assignee: "Researcher" },
  { id: "t10", title: "Cron MCP retry logic", status: "todo", priority: "critical", assignee: "Coder" },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "message", description: "Processed query from WhatsApp DM", timestamp: "2 min ago", platform: "whatsapp" },
  { id: "a2", type: "agent", description: "Agent completed tool call: file_read", timestamp: "5 min ago" },
  { id: "a3", type: "task", description: "Cron job 'daily-summary' executed successfully", timestamp: "12 min ago" },
  { id: "a4", type: "message", description: "Telegram group message processed", timestamp: "18 min ago", platform: "telegram" },
  { id: "a5", type: "system", description: "Memory file updated: 2026-03-21.md", timestamp: "25 min ago" },
  { id: "a6", type: "agent", description: "Agent used Composio: Google Calendar", timestamp: "32 min ago" },
  { id: "a7", type: "message", description: "Processed 3 queued messages", timestamp: "45 min ago" },
  { id: "a8", type: "system", description: "Gateway restarted — all adapters reconnected", timestamp: "1 hr ago" },
];

export const TOKEN_USAGE_BY_MODEL = [
  { model: "claude-opus-4-6", tokens: 520000, cost: 7.80 },
  { model: "claude-sonnet-4-5", tokens: 480000, cost: 3.60 },
  { model: "claude-haiku-4-5", tokens: 200000, cost: 1.00 },
];

// ─── Composer Data ───────────────────────────────────────────────

export interface AgentOption {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  tag?: string; // e.g. "NEW", "FAST"
}

export const AGENTS: AgentOption[] = [
  { id: "default", name: "m-y-ai", description: "Default personal assistant" },
  { id: "researcher", name: "Researcher", description: "Deep web research agent" },
  { id: "coder", name: "Coder", description: "Code generation & review" },
  { id: "writer", name: "Writer", description: "Content & copywriting" },
];

export const MODELS: ModelOption[] = [
  { id: "claude-opus-4-6", name: "Opus 4.6", provider: "Anthropic", tag: "NEW" },
  { id: "claude-sonnet-4-5", name: "Sonnet 4.5", provider: "Anthropic" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", provider: "Anthropic", tag: "FAST" },
  { id: "gpt-5-4", name: "GPT-5.4", provider: "OpenAI", tag: "NEW" },
  { id: "gemini-3-1-flash", name: "Gemini 3.1 Flash", provider: "Google" },
];
