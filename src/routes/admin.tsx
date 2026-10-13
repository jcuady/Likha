import { createFileRoute } from "@tanstack/react-router";

import { AppShell, RequireAuth } from "@/components/app/app-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <RequireAuth role="admin">
      <AppShell role="admin" />
    </RequireAuth>
  );
}
