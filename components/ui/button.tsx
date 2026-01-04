import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "premium-gradient text-white shadow-purple-glow hover:shadow-purple-glow-sm hover:scale-105 active:scale-95",
        outline: "border border-purple-500/30 bg-surface-dark/50 text-text-secondary hover:bg-surface-medium hover:border-purple-500/50 hover:text-text-primary",
        secondary: "bg-surface-medium text-text-primary hover:bg-surface-light hover:shadow-purple-glow-sm",
        ghost: "text-text-tertiary hover:bg-surface-dark hover:text-text-primary",
        destructive: "bg-rose-600 text-white hover:bg-rose-500 hover:shadow-lg",
        subtle: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300",
        gradient: "premium-gradient-gold text-white shadow-glow hover:shadow-purple-glow hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };


