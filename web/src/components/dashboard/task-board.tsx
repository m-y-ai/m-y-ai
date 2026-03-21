"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TaskItem } from "@/lib/mock-data";

const COLUMNS = [
  { key: "todo" as const, label: "To Do" },
  { key: "in_progress" as const, label: "In Progress" },
  { key: "done" as const, label: "Done" },
];

export function TaskBoard({ tasks }: { tasks: TaskItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="rounded-lg bg-muted/40 p-2"
              >
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md bg-card border border-border p-2.5 text-sm"
                    >
                      <p className="leading-snug">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {task.assignee}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
