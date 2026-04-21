import { useUIScale, type UIScaleLevel } from "@/hooks/use-ui-scale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * ScaleControl — A- / A / A+ accessibility control for the top navbar.
 *
 * Placement: Insert BEFORE the notification bell in the header.
 * Features:
 *  - Three toggle buttons for small / default / large scale
 *  - Active state visually highlighted with primary color
 *  - Keyboard navigable with visible focus ring
 *  - aria-pressed for selected state
 *  - aria-label on each button
 *  - Tooltip for extra context
 *  - Fixed-width buttons to prevent layout shift when toggling
 */

const SCALE_OPTIONS: { level: UIScaleLevel; label: string; ariaLabel: string }[] = [
  { level: "small", label: "A−", ariaLabel: "Decrease text size" },
  { level: "default", label: "A", ariaLabel: "Reset to default text size" },
  { level: "large", label: "A+", ariaLabel: "Increase text size" },
];

export function ScaleControl() {
  const { scale, setScale } = useUIScale();

  return (
    <div
      className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0"
      role="group"
      aria-label="Text size controls"
    >
      {SCALE_OPTIONS.map(({ level, label, ariaLabel }) => {
        const isActive = scale === level;
        return (
          <Tooltip key={level}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setScale(level)}
                aria-pressed={isActive}
                aria-label={ariaLabel}
                className={`
                  relative inline-flex items-center justify-center
                  w-7 h-7 rounded-[0.25rem]
                  text-xs font-bold leading-none
                  transition-all duration-150 ease-in-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                {label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {ariaLabel}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
