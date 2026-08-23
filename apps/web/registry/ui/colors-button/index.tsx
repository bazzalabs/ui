import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const stateClasses =
  'bg-[var(--button-background)] text-[var(--button-foreground)] [box-shadow:var(--button-shadow)] hover:bg-[var(--button-background-hover)] hover:text-[var(--button-foreground-hover)] hover:[box-shadow:var(--button-shadow-hover)] active:bg-[var(--button-background-active)] active:text-[var(--button-foreground-active)] active:translate-y-px active:[box-shadow:var(--button-shadow-active)] focus-visible:[box-shadow:var(--button-shadow-focus)]'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,box-shadow,transform] hover:transition-none disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none select-none",
  {
    variants: {
      variant: {
        'primary-neutral': stateClasses,
        'primary-accent': stateClasses,
        destructive: stateClasses,
        outline: stateClasses,
        secondary: stateClasses,
        ghost: stateClasses,
        link: `${stateClasses} hover:underline underline-offset-4`,
      },
      size: {
        default: 'h-9 gap-2 px-4 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-md',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary-neutral',
      size: 'default',
    },
  },
)

export type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string
    loading?: boolean
  }

function Button({
  className,
  variant,
  size,
  loading = false,
  disabled = false,
  'aria-busy': ariaBusy,
  children,
  ...props
}: ButtonProps) {
  const resolvedVariant = variant ?? 'primary-neutral'

  return (
    <ButtonPrimitive
      className={cn(
        buttonVariants({ variant: resolvedVariant, size, className }),
      )}
      {...props}
      data-slot="button"
      data-variant={resolvedVariant}
      aria-busy={loading ? true : ariaBusy}
      disabled={loading || disabled}
    >
      {loading && <LoaderCircle aria-hidden="true" className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
