import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        solid: "shadow-xs",
        outline:
          "border bg-background shadow-xs dark:bg-input/30 dark:border-input",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      color: {
        primary: "",
        secondary: "",
        destructive: "",
        neutral: "",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    compoundVariants: [
      // Solid variants
      {
        variant: "solid",
        color: "primary",
        class: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        variant: "solid",
        color: "secondary",
        class: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      {
        variant: "solid",
        color: "destructive",
        class:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      },
      {
        variant: "solid",
        color: "neutral",
        class: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      // Outline variants
      {
        variant: "outline",
        color: "primary",
        class:
          "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
      },
      {
        variant: "outline",
        color: "secondary",
        class:
          "border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground",
      },
      {
        variant: "outline",
        color: "destructive",
        class:
          "border-destructive text-destructive hover:bg-destructive hover:text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      {
        variant: "outline",
        color: "neutral",
        class:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50",
      },
      // Ghost variants
      {
        variant: "ghost",
        color: "primary",
        class: "text-primary hover:bg-primary/10 hover:text-primary",
      },
      {
        variant: "ghost",
        color: "secondary",
        class: "text-secondary hover:bg-secondary/10 hover:text-secondary",
      },
      {
        variant: "ghost",
        color: "destructive",
        class:
          "text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      {
        variant: "ghost",
        color: "neutral",
        class:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      },
      // Link variants
      {
        variant: "link",
        color: "primary",
        class: "text-primary",
      },
      {
        variant: "link",
        color: "secondary",
        class: "text-secondary",
      },
      {
        variant: "link",
        color: "destructive",
        class:
          "text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      {
        variant: "link",
        color: "neutral",
        class: "text-muted-foreground",
      },
    ],
    defaultVariants: {
      variant: "solid",
      color: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  color,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, color, size, className }))}
      {...props}
    />
  );
}
