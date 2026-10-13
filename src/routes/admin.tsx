import { createFileRoute } from "@tanstack/react-router";

import { AppShell, RequireAuth } from "@/components/app/app-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Operations | Likha Admin" },
      {
        name: "description",
        content: "Manage Likha listings, investors, occupancy, and distribution health.",
      },
    ],
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
