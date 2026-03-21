import { PrimarySidebar } from "./primary-sidebar";
import { SecondarySidebar } from "./secondary-sidebar";
import { ContentArea } from "./content-area";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PrimarySidebar />
      <SecondarySidebar />
      <ContentArea>{children}</ContentArea>
    </div>
  );
}
