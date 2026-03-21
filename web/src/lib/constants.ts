import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  BriefcaseBusiness,
  FolderOpen,
  Bot,
  Brain,
  UserCog,
  Zap,
  Plug,
  KeyRound,
  Settings,
  Star,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  FolderKanban,
  Compass,
  BookOpen,
  FileText,
  Image,
  Download,
  Trash2,
  Plus,
  Package,
  Shield,
  Radio,
  CreditCard,
  BarChart3,
  Monitor,
  RefreshCw,
  User,
  Wrench,
  Heart,
  Lock,
  Unlock,
  HelpCircle,
  Globe,
  MapPin,
  Languages,
  Bell,
  Palette,
  Eye,
  Wallpaper,
  Type,
  CircleDot,
  Mail,
  ListTodo,
  Search,
  Mic,
  Volume2,
  Video,
  MessageCircle,
  Hash,
  Send,
  Smartphone,
  AppWindow,
  type LucideIcon,
} from "lucide-react";

// ─── App Constants ───────────────────────────────────────────────

export const APP_NAME = "m-y-ai";
export const APP_DESCRIPTION = "Your personal AI platform";
export const GATEWAY_WS_URL =
  process.env.NEXT_PUBLIC_GATEWAY_WS_URL || "ws://localhost:4096";
export const GATEWAY_HTTP_URL =
  process.env.NEXT_PUBLIC_GATEWAY_HTTP_URL || "http://localhost:4096";

// ─── Sidebar dimensions ─────────────────────────────────────────

export const PRIMARY_SIDEBAR_WIDTH = 56; // px — icon strip
export const SECONDARY_SIDEBAR_WIDTH = 240; // px — sub-menu panel

// ─── Navigation Types ────────────────────────────────────────────

export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavSubGroup {
  id: string;
  label: string;
  items: NavSubItem[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  subItems?: NavSubItem[];
  subGroups?: NavSubGroup[];
}

// ─── Navigation Tree ─────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: Inbox,
    href: "/inbox",
    subItems: [
      { id: "inbox-all", label: "All", href: "/inbox", icon: Inbox },
      {
        id: "inbox-unread",
        label: "Unread",
        href: "/inbox/unread",
        icon: CircleDot,
      },
      {
        id: "inbox-starred",
        label: "Starred",
        href: "/inbox/starred",
        icon: Star,
      },
      {
        id: "inbox-archived",
        label: "Archived",
        href: "/inbox/archived",
        icon: Archive,
      },
    ],
  },
  {
    id: "chats",
    label: "Chats",
    icon: MessageSquare,
    href: "/chats",
    subItems: [
      {
        id: "chats-all",
        label: "All Chats",
        href: "/chats",
        icon: MessageSquare,
      },
      {
        id: "chats-active",
        label: "Active",
        href: "/chats/active",
        icon: Radio,
      },
      {
        id: "chats-archived",
        label: "Archived",
        href: "/chats/archived",
        icon: Archive,
      },
    ],
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: BriefcaseBusiness,
    href: "/jobs",
    subItems: [
      {
        id: "jobs-active",
        label: "Active",
        href: "/jobs",
        icon: BriefcaseBusiness,
      },
      {
        id: "jobs-scheduled",
        label: "Scheduled",
        href: "/jobs/scheduled",
        icon: Clock,
      },
      {
        id: "jobs-completed",
        label: "Completed",
        href: "/jobs/completed",
        icon: CheckCircle,
      },
      {
        id: "jobs-failed",
        label: "Failed",
        href: "/jobs/failed",
        icon: XCircle,
      },
    ],
  },
  {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    href: "/files",
    subItems: [
      {
        id: "files-projects",
        label: "Projects",
        href: "/files/projects",
        icon: FolderKanban,
      },
      {
        id: "files-areas",
        label: "Areas",
        href: "/files/areas",
        icon: Compass,
      },
      {
        id: "files-resources",
        label: "Resources",
        href: "/files/resources",
        icon: BookOpen,
      },
      {
        id: "files-archive",
        label: "Archive",
        href: "/files/archive",
        icon: Archive,
      },
      {
        id: "files-documents",
        label: "Documents",
        href: "/files/documents",
        icon: FileText,
      },
      {
        id: "files-media",
        label: "Media",
        href: "/files/media",
        icon: Image,
      },
      {
        id: "files-downloads",
        label: "Downloads",
        href: "/files/downloads",
        icon: Download,
      },
      {
        id: "files-temp",
        label: "Temp",
        href: "/files/temp",
        icon: Trash2,
      },
    ],
  },
  {
    id: "assistants",
    label: "Assistants",
    icon: Bot,
    href: "/assistants",
    subItems: [
      {
        id: "assistants-all",
        label: "All Assistants",
        href: "/assistants",
        icon: Bot,
      },
      {
        id: "assistants-new",
        label: "Create New",
        href: "/assistants/new",
        icon: Plus,
      },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    icon: Brain,
    href: "/agents",
    subItems: [
      { id: "agents-all", label: "All Agents", href: "/agents", icon: Brain },
      {
        id: "agents-default",
        label: "Default Agent",
        href: "/agents/default",
        icon: User,
      },
      {
        id: "agents-new",
        label: "Create New",
        href: "/agents/new",
        icon: Plus,
      },
    ],
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: UserCog,
    href: "/personalization",
    subItems: [
      {
        id: "personalization-about",
        label: "About Me",
        href: "/personalization",
        icon: User,
      },
      {
        id: "personalization-tools",
        label: "My Tools",
        href: "/personalization/tools",
        icon: Wrench,
      },
      {
        id: "personalization-preferences",
        label: "My Preferences",
        href: "/personalization/preferences",
        icon: Heart,
      },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    icon: Zap,
    href: "/skills",
    subItems: [
      { id: "skills-all", label: "All Skills", href: "/skills", icon: Zap },
      {
        id: "skills-installed",
        label: "Installed",
        href: "/skills/installed",
        icon: Package,
      },
      {
        id: "skills-browse",
        label: "Browse",
        href: "/skills/browse",
        icon: Search,
      },
    ],
  },
  {
    id: "mcps",
    label: "MCPs",
    icon: Plug,
    href: "/mcps",
    subItems: [
      { id: "mcps-connected", label: "Connected", href: "/mcps", icon: Plug },
      {
        id: "mcps-available",
        label: "Available",
        href: "/mcps/available",
        icon: Plus,
      },
      {
        id: "mcps-composio",
        label: "Composio",
        href: "/mcps/composio",
        icon: Package,
      },
    ],
  },
  {
    id: "secrets",
    label: "Secrets",
    icon: KeyRound,
    href: "/secrets",
    subItems: [
      {
        id: "secrets-apikeys",
        label: "API Keys",
        href: "/secrets",
        icon: KeyRound,
      },
      {
        id: "secrets-tokens",
        label: "Tokens",
        href: "/secrets/tokens",
        icon: Lock,
      },
      {
        id: "secrets-credentials",
        label: "Credentials",
        href: "/secrets/credentials",
        icon: Shield,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
    subGroups: [
      {
        id: "settings-general",
        label: "General",
        items: [
          {
            id: "settings-backup",
            label: "Backup",
            href: "/settings/backup",
            icon: RefreshCw,
          },
        ],
      },
      {
        id: "settings-access",
        label: "Access Control",
        items: [
          {
            id: "settings-permissions",
            label: "Permissions",
            href: "/settings/permissions",
            icon: Shield,
          },
          {
            id: "settings-permissions-allowed",
            label: "Allowed",
            href: "/settings/permissions/allowed",
            icon: Unlock,
          },
          {
            id: "settings-permissions-blocked",
            label: "Blocked",
            href: "/settings/permissions/blocked",
            icon: Lock,
          },
          {
            id: "settings-permissions-ask",
            label: "Ask",
            href: "/settings/permissions/ask",
            icon: HelpCircle,
          },
        ],
      },
      {
        id: "settings-channels",
        label: "Channels",
        items: [
          {
            id: "settings-channels-all",
            label: "All Channels",
            href: "/settings/channels",
            icon: Radio,
          },
          {
            id: "settings-channels-app",
            label: "App",
            href: "/settings/channels/app",
            icon: AppWindow,
          },
          {
            id: "settings-channels-web",
            label: "Web",
            href: "/settings/channels/web",
            icon: Globe,
          },
          {
            id: "settings-channels-telegram",
            label: "Telegram",
            href: "/settings/channels/telegram",
            icon: Send,
          },
          {
            id: "settings-channels-whatsapp",
            label: "WhatsApp",
            href: "/settings/channels/whatsapp",
            icon: MessageCircle,
          },
          {
            id: "settings-channels-slack",
            label: "Slack",
            href: "/settings/channels/slack",
            icon: Hash,
          },
          {
            id: "settings-channels-discord",
            label: "Discord",
            href: "/settings/channels/discord",
            icon: MessageSquare,
          },
        ],
      },
      {
        id: "settings-providers",
        label: "Providers",
        items: [
          {
            id: "settings-providers-all",
            label: "All Providers",
            href: "/settings/providers",
            icon: CreditCard,
          },
          {
            id: "settings-providers-llm",
            label: "LLM",
            href: "/settings/providers/llm",
            icon: Brain,
          },
          {
            id: "settings-providers-image",
            label: "Image Generation",
            href: "/settings/providers/image",
            icon: Image,
          },
          {
            id: "settings-providers-video",
            label: "Video Generation",
            href: "/settings/providers/video",
            icon: Video,
          },
          {
            id: "settings-providers-tts",
            label: "TTS",
            href: "/settings/providers/tts",
            icon: Volume2,
          },
          {
            id: "settings-providers-stt",
            label: "STT",
            href: "/settings/providers/stt",
            icon: Mic,
          },
          {
            id: "settings-providers-search",
            label: "Search",
            href: "/settings/providers/search",
            icon: Search,
          },
          {
            id: "settings-providers-email",
            label: "Email",
            href: "/settings/providers/email",
            icon: Mail,
          },
          {
            id: "settings-providers-tasks",
            label: "Task Management",
            href: "/settings/providers/tasks",
            icon: ListTodo,
          },
        ],
      },
      {
        id: "settings-analytics",
        label: "Analytics",
        items: [
          {
            id: "settings-usage",
            label: "Usage",
            href: "/settings/usage",
            icon: BarChart3,
          },
        ],
      },
      {
        id: "settings-system",
        label: "System",
        items: [
          {
            id: "settings-system-general",
            label: "System Settings",
            href: "/settings/system",
            icon: Monitor,
          },
          {
            id: "settings-system-timezone",
            label: "Timezone",
            href: "/settings/system/timezone",
            icon: Clock,
          },
          {
            id: "settings-system-location",
            label: "Location",
            href: "/settings/system/location",
            icon: MapPin,
          },
          {
            id: "settings-system-language",
            label: "Language / Region",
            href: "/settings/system/language",
            icon: Languages,
          },
          {
            id: "settings-system-notifications",
            label: "Notifications",
            href: "/settings/system/notifications",
            icon: Bell,
          },
          {
            id: "settings-system-appearance",
            label: "Appearance",
            href: "/settings/system/appearance",
            icon: Palette,
          },
          {
            id: "settings-system-wallpaper",
            label: "Wallpaper",
            href: "/settings/system/wallpaper",
            icon: Wallpaper,
          },
          {
            id: "settings-system-theme",
            label: "Theme",
            href: "/settings/system/theme",
            icon: Palette,
          },
          {
            id: "settings-system-fonts",
            label: "Fonts",
            href: "/settings/system/fonts",
            icon: Type,
          },
          {
            id: "settings-system-privacy",
            label: "Privacy",
            href: "/settings/system/privacy",
            icon: Eye,
          },
          {
            id: "settings-system-security",
            label: "Security",
            href: "/settings/system/security",
            icon: Shield,
          },
          {
            id: "settings-system-packages",
            label: "Packages",
            href: "/settings/system/packages",
            icon: Package,
          },
          {
            id: "settings-updates",
            label: "Updates",
            href: "/settings/updates",
            icon: RefreshCw,
          },
        ],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS.find((item) => item.href === "/");
  const segment = "/" + pathname.split("/").filter(Boolean)[0];
  return NAV_ITEMS.find((item) => item.href === segment);
}

export function findSubItem(
  navItem: NavItem,
  pathname: string
): NavSubItem | undefined {
  const allSubs = getAllSubItems(navItem);
  // Exact match first, then prefix match
  return (
    allSubs.find((sub) => sub.href === pathname) ||
    allSubs
      .filter((sub) => pathname.startsWith(sub.href) && sub.href !== navItem.href)
      .sort((a, b) => b.href.length - a.href.length)[0]
  );
}

export function getAllSubItems(navItem: NavItem): NavSubItem[] {
  if (navItem.subItems) return navItem.subItems;
  if (navItem.subGroups) return navItem.subGroups.flatMap((g) => g.items);
  return [];
}

export function getPageTitle(pathname: string): string {
  const navItem = findNavItem(pathname);
  if (!navItem) return APP_NAME;
  const subItem = findSubItem(navItem, pathname);
  return subItem ? subItem.label : navItem.label;
}
