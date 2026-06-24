import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20",
        premium: "btn-premium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent/30 hover:text-accent-foreground shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground uppercase tracking-widest font-black text-[10px]",
        link: "text-primary underline-offset-4 hover:underline lowercase font-medium tracking-normal",
        hero: "bg-hero-gradient text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300",
        "hero-outline": "border-2 border-primary text-primary hover:bg-accent transition-all duration-300",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 rounded-xl px-3 text-[10px]",
        lg: "h-14 rounded-3xl px-10 text-base",
        icon: "h-12 w-12",
        premium: "h-14 px-10",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    if (variant === 'premium') {
      return (
        <Comp 
          className={cn(buttonVariants({ variant, size, className }))} 
          ref={ref} 
          {...props}
        >
          <span className="btn-text">{children}</span>
          <span className="btn-icon">
            <ArrowRight className="w-5 h-5" />
          </span>
        </Comp>
      );
    }

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Comp>;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
