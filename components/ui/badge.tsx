import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
        secondary: "bg-[rgb(30,30,40)] text-[rgb(200,200,210)] border border-[rgb(40,40,55)]",
        destructive: "bg-red-600/20 text-red-300 border border-red-600/30",
        success: "bg-green-600/20 text-green-300 border border-green-600/30",
        warning: "bg-yellow-600/20 text-yellow-300 border border-yellow-600/30",
        sol: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
        btc: "bg-orange-600/20 text-orange-300 border border-orange-600/30",
        eth: "bg-blue-600/20 text-blue-300 border border-blue-600/30",
        outline: "border border-[rgb(40,40,55)] text-[rgb(200,200,210)]",
        live: "bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
