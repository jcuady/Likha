import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
};

/** Shown wherever a signed-in account has nothing to display yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center ${className ?? ""}`}
    >
      {Icon ? (
        <span className="grid size-11 place-items-center rounded-full bg-secondary">
          <Icon data-icon aria-hidden className="size-5 text-muted-foreground" />
        </span>
      ) : null}
      <h2 className="text-base font-medium">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action || secondaryAction ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
          {secondaryAction ? (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
