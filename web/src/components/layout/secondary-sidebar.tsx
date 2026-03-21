"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  SECONDARY_SIDEBAR_WIDTH,
  getAllSubItems,
  type NavItem,
} from "@/lib/constants";
import { useActiveNav } from "@/hooks/use-active-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SecondarySidebar() {
  const { activeSection, pathname } = useActiveNav();

  // Hide when no section or no sub-items (e.g. Dashboard)
  const hasSubItems = activeSection?.subItems?.length || activeSection?.subGroups?.length;
  if (!activeSection || !hasSubItems) return null;

  return (
    <aside
      className="hidden md:flex flex-col min-h-0 border-r border-border bg-background"
      style={{ width: SECONDARY_SIDEBAR_WIDTH }}
    >
      {/* Section header — aligned with h-12 header row across all panels */}
      <div className="flex items-center h-12 px-4 shrink-0 border-b border-border">
        <h2 className="text-sm font-semibold tracking-tight">
          {activeSection.label}
        </h2>
      </div>

      {/* Sub-items */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <nav className="p-2">
          {activeSection.subItems && (
            <SubItemList
              items={activeSection.subItems}
              pathname={pathname}
            />
          )}

          {activeSection.subGroups &&
            activeSection.subGroups.map((group, i) => (
              <div key={group.id}>
                {i > 0 && <Separator className="my-2" />}
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <SubItemList items={group.items} pathname={pathname} />
              </div>
            ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function SubItemList({
  items,
  pathname,
}: {
  items: { id: string; label: string; href: string; icon?: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((sub) => {
        const isActive = pathname === sub.href;
        const Icon = sub.icon;

        return (
          <li key={sub.id}>
            <Link
              href={sub.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span className="truncate">{sub.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
