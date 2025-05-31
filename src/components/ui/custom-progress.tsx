
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CustomProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
          style={{ width: `${value}%` }}
        />
      </div>
    );
  }
);

CustomProgress.displayName = "CustomProgress";

export { CustomProgress };
