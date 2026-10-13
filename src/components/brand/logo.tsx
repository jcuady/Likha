import { cn } from "@/lib/utils";
import mark from "@/assets/likha_mark.png";
import logo from "@/assets/likha_logo_trimmed.png";

type LogoProps = {
  /** `mark` is the icon tile, `wordmark` the full lockup. */
  variant?: "mark" | "wordmark";
  className?: string;
  /** Announced to assistive tech; pass null inside an already-labelled link. */
  label?: string | null;
};

export function Logo({ variant = "mark", className, label = "Likha" }: LogoProps) {
  if (variant === "wordmark") {
    return (
      <img
        src={logo}
        alt={label ?? ""}
        aria-hidden={label === null || undefined}
        className={cn("h-auto w-[112px]", className)}
      />
    );
  }
  return (
    <img
      src={mark}
      alt={label ?? ""}
      aria-hidden={label === null || undefined}
      className={cn("size-9 rounded-lg object-contain", className)}
    />
  );
}
