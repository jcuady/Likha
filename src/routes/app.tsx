import { createFileRoute } from "@tanstack/react-router";

import { AppShell, RequireAuth } from "@/components/app/app-shell";

export const Route = createFileRoute("/app")({
  // Signed-in dashboards are per-account views behind a client-side guard. They
  // have no standalone value in search, and the root fallback canonical would
  // otherwise point every one of them at the homepage.
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Your portfolio | Likha" },
      {
        name: "description",
        content: "Track your Likha holdings, monthly rent income, and property statements.",
      },
    ],
  }),
  component: InvestorLayout,
});

function InvestorLayout() {
  return (
    <RequireAuth role="investor">
      <AppShell role="investor" />
    </RequireAuth>
  );
}
