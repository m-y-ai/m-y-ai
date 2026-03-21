"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveNav } from "@/hooks/use-active-nav";
import { getPageTitle } from "@/lib/constants";
import { MobileNav } from "./mobile-nav";

export function ContentArea({ children }: { children: React.ReactNode }) {
  const { pathname } = useActiveNav();
  const title = getPageTitle(pathname);

  return (
    <main className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Top bar */}
      <header className="flex items-center h-12 px-4 border-b border-border shrink-0 gap-3">
        <MobileNav />
        <h1 className="text-sm font-semibold truncate">{title}</h1>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">{children}</div>
      </ScrollArea>
    </main>
  );
}
