"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, PRIMARY_SIDEBAR_WIDTH } from "@/lib/constants";
import { useActiveNav } from "@/hooks/use-active-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PrimarySidebar() {
  const { activeSection } = useActiveNav();

  return (
    <aside
      className="hidden md:flex flex-col items-center border-r border-border bg-sidebar"
      style={{ width: PRIMARY_SIDEBAR_WIDTH }}
    >
      {/* Logo — matches h-12 header row of other panels */}
      <div className="flex items-center justify-center h-12 w-full shrink-0 border-b border-border">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-primary"
        >
          <Brain className="w-5 h-5" />
        </Link>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection?.id === item.id;
          const Icon = item.icon;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  />
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="primary-active"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icon className="relative z-10 w-[18px] h-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
