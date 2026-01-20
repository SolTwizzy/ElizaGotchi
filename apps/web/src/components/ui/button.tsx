import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-black focus-visible:-outline-offset-4 disabled:pointer-events-none disabled:opacity-50 border-2 active:border-t-[#808080] active:border-l-[#808080] active:border-b-[#ffffff] active:border-r-[#ffffff]',
  {
    variants: {
      variant: {
        default: 'bg-[#c0c0c0] text-black border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] hover:bg-[#d4d4d4]',
        destructive: 'bg-[#c0c0c0] text-[#cc0000] border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] hover:bg-[#d4d4d4]',
        outline: 'bg-[#c0c0c0] text-black border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] hover:bg-[#d4d4d4]',
        secondary: 'bg-[#c0c0c0] text-black border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] hover:bg-[#d4d4d4]',
        ghost: 'bg-transparent border-transparent hover:bg-[#c0c0c0]/50 hover:border-t-[#ffffff] hover:border-l-[#ffffff] hover:border-b-[#808080] hover:border-r-[#808080]',
        link: 'text-[#0000ff] underline-offset-4 hover:underline border-transparent bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
