import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react' // or any icon you prefer
import { cn } from '@/lib/utils'
import CodeInline from './code-inline' // the inline Shiki component from earlier

type Props = {
  name: string
  type: string
  required?: boolean
  defaultValue?: string
  description?: string
  className?: string
}

export default function PropRow({
  name,
  type,
  required = false,
  defaultValue,
  description,
  className,
}: Props) {
  console.log('PropRow:', name, required)
  return (
    <Collapsible.Root
      className={cn('grid grid-cols-subgrid col-span-2 gap-x-12', className)}
    >
      <Collapsible.Trigger
        className="group w-full items-center justify-between gap-x-12 px-3 py-2 hover:bg-muted/75 grid-cols-subgrid grid col-span-2"
        aria-label={`Toggle ${name}`}
      >
        <div className="flex items-center gap-2">
          <code className="rounded-sm bg-muted px-1 text-sm border">
            {name}
          </code>
          {required && (
            <span className="text-xs font-medium text-red-500">required</span>
          )}
        </div>
        <div className="flex items-center w-full justify-between gap-3">
          {/* short type preview */}
          <div className="hidden md:block text-sm text-muted-foreground max-w-[40ch] truncate">
            <CodeInline code={type} lang="ts" />
          </div>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </Collapsible.Trigger>

      <Collapsible.Content className="p-3 grid grid-cols-subgrid col-span-2 border-y bg-muted-foreground/5">
        <dl className="grid grid-cols-subgrid col-span-2 items-start gap-x-12 gap-y-4 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="overflow-x-auto">
            <code>{name}</code>
          </dd>
          <dt className="text-muted-foreground">Type</dt>
          <dd className="overflow-x-auto">
            <CodeInline code={type} lang="ts" />
          </dd>

          <dt className="text-muted-foreground">Required</dt>
          <dd>{required ? 'Yes' : 'No'}</dd>

          {defaultValue !== undefined && defaultValue !== '' ? (
            <>
              <dt className="text-muted-foreground">Default</dt>
              <dd>
                <CodeInline code={defaultValue} lang="ts" />
              </dd>
            </>
          ) : null}

          {description ? (
            <>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="whitespace-pre-wrap">{description}</dd>
            </>
          ) : null}
        </dl>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
