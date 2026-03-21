"use client";

import { QuickComposer } from "./quick-composer";
import { StatCards } from "./stat-cards";
import { ChannelStatusCard } from "./channel-status";
import { TaskBoard } from "./task-board";
import { ActivityFeed } from "./activity-feed";
import { TokenUsage } from "./token-usage";
import {
  DASHBOARD_STATS,
  CHANNEL_STATUSES,
  TASKS,
  RECENT_ACTIVITY,
  TOKEN_USAGE_BY_MODEL,
} from "@/lib/mock-data";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your AI platform
        </p>
      </div>

      {/* Quick composer */}
      <QuickComposer />

      {/* Stats row */}
      <StatCards stats={DASHBOARD_STATS} />

      {/* Main grid: tasks + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Task board — takes 2 cols on xl */}
        <div className="xl:col-span-2">
          <TaskBoard tasks={TASKS} />
        </div>

        {/* Right sidebar: channels + token usage */}
        <div className="space-y-4">
          <ChannelStatusCard channels={CHANNEL_STATUSES} />
          <TokenUsage models={TOKEN_USAGE_BY_MODEL} />
        </div>
      </div>

      {/* Activity feed */}
      <ActivityFeed activity={RECENT_ACTIVITY} />
    </div>
  );
}
