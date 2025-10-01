import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority'; // Use both imports

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

// Define button variants using cva
const buttonVariants = cva(
  'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: cn(
          'bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white shadow-md',
          'hover:from-[#ff8a5b] hover:to-[#ffb86c] hover:shadow-xl hover:-translate-y-0.5',
          'active:scale-[0.98] active:shadow-md',
          'focus-visible:ring-[#ff7043]'
        ),
        secondary: cn(
          'bg-white/20 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300',
          'border border-[#ff7043]/30 dark:border-[#ffb86c]/30',
          'hover:bg-white/30 dark:hover:bg-gray-800/30 hover:-translate-y-0.5',
          'active:scale-[0.98]',
          'focus-visible:ring-[#ff7043]',
          'button-glass-card'
        ),
        outline: cn(
          'border-2 border-[#ff7043] text-[#ff7043] dark:text-[#ffb86c]',
          'bg-transparent hover:bg-[#ff7043]/10 dark:hover:bg-[#ff7043]/5',
          'hover:-translate-y-0.5 active:scale-[0.98]',
          'focus-visible:ring-[#ff7043]'
        ),
        ghost: cn(
          'text-[#ff7043] dark:text-[#ffb86c] bg-transparent',
          'hover:bg-[#ff7043]/10 dark:hover:bg-[#ff7043]/5',
          'hover:-translate-y-0.5 active:scale-[0.98]',
          'focus-visible:ring-[#ff7043]'
        ),
        danger: cn(
          'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
          'hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:-translate-y-0.5',
          'active:scale-[0.98] active:shadow-md',
          'focus-visible:ring-red-500'
        ),
      },
      size: {
        sm: 'px-3 py-1.5 text-xs min-h-[32px]',
        md: 'px-4 py-2 text-sm min-h-[40px]',
        lg: 'px-6 py-3 text-base min-h-[48px]',
        xl: 'px-8 py-4 text-lg min-h-[56px]',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'cursor-wait',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  icon,
  iconPosition = 'left',
  type = 'button',
  fullWidth = false,
  asChild = false,
  ...rest
}, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const renderIcon = () => {
    if (!icon && !loading) return null;
    const iconContent = loading ? (
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
    ) : (
      icon
    );
    return (
      <div className={cn(
        'flex items-center justify-center',
        variant === 'primary' && 'text-white',
        variant === 'danger' && 'text-white',
        (variant === 'secondary' || variant === 'outline' || variant === 'ghost') && 'text-[#ff7043] dark:text-[#ffb86c]'
      )}>
        {iconContent}
      </div>
    );
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <>
      <style>
        {`
          @keyframes buttonPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          .animate-button-pulse { animation: buttonPulse 2s ease-in-out infinite; }
          .button-glass-card {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          }
          .dark .button-glass-card {
            background: rgba(26, 26, 46, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          @keyframes buttonShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-button-shimmer { animation: buttonShimmer 2s infinite; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
        `}
      </style>

      <Comp
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth, loading }), className)}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {(variant === 'secondary') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-button-shimmer pointer-events-none" />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {iconPosition === 'left' && renderIcon()}
          <span className={loading ? 'opacity-70' : ''}>{children}</span>
          {iconPosition === 'right' && renderIcon()}
        </span>

        {loading && (
          <div className="absolute inset-0 bg-current opacity-10 rounded-xl" />
        )}
      </Comp>
    </>
  );
});

Button.displayName = 'Button';

export default Button;