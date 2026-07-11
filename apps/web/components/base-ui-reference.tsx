import { ArrowUpRightIcon } from 'lucide-react'

interface BaseUIReferenceProps {
  /**
   * The Base UI component path, e.g., "popover" for Popover
   */
  component: string
  /**
   * The specific part/section, e.g., "arrow" for Popover.Arrow
   */
  part: string
  /**
   * Whether this is a wrapper (extends Base UI) or a direct re-export
   * @default false (direct re-export)
   */
  wrapper?: boolean
}

function formatComponentName(component: string, part: string): string {
  const componentName = component.charAt(0).toUpperCase() + component.slice(1)
  const partName = part
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return `${componentName}.${partName}`
}

/**
 * Displays a link to the Base UI API reference for a component.
 * Use this for components that are direct re-exports or wrappers of Base UI components.
 */
export function BaseUIReference({
  component,
  part,
  wrapper = false,
}: BaseUIReferenceProps) {
  const url = `https://base-ui.com/react/components/${component}#${part}`
  const formattedName = formatComponentName(component, part)

  const text = wrapper
    ? 'This component extends'
    : 'This component is a direct re-export of'

  return (
    <div className="my-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
      <BaseUILogo className="mr-1" />
      <span>{text}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
      >
        Base UI {formattedName}
        <ArrowUpRightIcon className="size-4 translate-y-[-4px] translate-x-[-2px] text-muted-foreground" />
      </a>
      .
    </div>
  )
}

const BaseUILogo = (props: React.ComponentProps<'svg'>) => (
  <svg
    width="17"
    height="24"
    viewBox="0 0 17 24"
    fill="currentcolor"
    aria-label="Base UI"
    {...props}
  >
    <path d="M9.5001 7.01537C9.2245 6.99837 9 7.22385 9 7.49999V23C13.4183 23 17 19.4183 17 15C17 10.7497 13.6854 7.27351 9.5001 7.01537Z" />
    <path d="M8 9.8V12V23C3.58172 23 0 19.0601 0 14.2V12V1C4.41828 1 8 4.93989 8 9.8Z" />
  </svg>
)
