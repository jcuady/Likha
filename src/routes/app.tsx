import { createFileRoute } from "@tanstack/react-router";

import { AppShell, RequireAuth } from "@/components/app/app-shell";

export const Route = createFileRoute("/app")({
  component: InvestorLayout,
});

function InvestorLayout() {
  return (
    <RequireAuth role="investor">
      <AppShell role="investor" />
    </RequireAuth>
  );
}
