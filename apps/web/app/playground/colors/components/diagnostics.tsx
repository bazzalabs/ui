import type {
  ButtonStateDifferenceDiagnostic,
  GeneratedTheme,
  ThemeDiagnostic,
  ThemeMode,
} from '@bazza-ui/colors'

type DiagnosticWithMode = Readonly<{
  mode: ThemeMode
  diagnostic: ThemeDiagnostic
}>

export function Diagnostics({ theme }: { theme: GeneratedTheme }) {
  const diagnostics: DiagnosticWithMode[] = (
    ['light', 'dark'] as const
  ).flatMap((mode) =>
    theme[mode].diagnostics.map((diagnostic) => ({ mode, diagnostic })),
  )
  const differences = diagnostics.filter(
    (
      item,
    ): item is DiagnosticWithMode & {
      diagnostic: ButtonStateDifferenceDiagnostic
    } => isStateDifference(item.diagnostic),
  )
  const text = diagnostics.filter(
    ({ diagnostic }) =>
      diagnostic.kind === 'gated' &&
      !isStateDifference(diagnostic) &&
      diagnostic.required === 4.5,
  )
  const components = diagnostics.filter(
    ({ diagnostic }) =>
      diagnostic.kind === 'gated' &&
      !isStateDifference(diagnostic) &&
      diagnostic.required === 3,
  )
  const disabled = diagnostics.filter(
    ({ diagnostic }) =>
      diagnostic.kind === 'informational' &&
      diagnostic.path === 'foreground.disabled',
  )

  return (
    <section
      aria-labelledby="diagnostics-heading"
      className="rounded-xl border p-4 sm:p-6"
    >
      <div>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">
          Measured output
        </p>
        <h2 id="diagnostics-heading" className="mt-1 font-semibold text-2xl">
          Diagnostics
        </h2>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DiagnosticGroup
          title="WCAG text contrast"
          description="Required 4.5:1"
          items={text}
          format="contrast"
        />
        <DiagnosticGroup
          title="Focus and component contrast"
          description="Required 3:1"
          items={components}
          format="contrast"
        />
        <DiagnosticGroup
          title="Disabled contrast"
          description="Informational, no pass gate"
          items={disabled}
          format="contrast"
        />
        <DiagnosticGroup
          title="Hover and active difference"
          description="OKLCH perceptual difference"
          items={differences}
          format="difference"
        />
      </div>
    </section>
  )
}

function DiagnosticGroup({
  title,
  description,
  items,
  format,
}: {
  title: string
  description: string
  items: readonly DiagnosticWithMode[]
  format: 'contrast' | 'difference'
}) {
  const passing = items.filter(
    ({ diagnostic }) => diagnostic.kind === 'gated' && diagnostic.pass,
  ).length
  return (
    <div className="min-w-0 rounded-lg border bg-muted/10">
      <div className="flex items-start justify-between gap-4 border-b p-4">
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="mt-1 text-muted-foreground text-xs">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-1 font-mono text-[10px]">
          {items.every(({ diagnostic }) => diagnostic.kind === 'informational')
            ? `${items.length} info`
            : `${passing}/${items.length} pass`}
        </span>
      </div>
      <section
        className="max-h-80 divide-y overflow-y-auto"
        aria-label={`${title} results`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll long results.
        tabIndex={0}
      >
        <ul className="divide-y">
          {items.map(({ mode, diagnostic }, index) => {
            const status =
              diagnostic.kind === 'informational'
                ? 'Informational'
                : diagnostic.pass
                  ? 'Pass'
                  : 'Fail'
            const required =
              diagnostic.kind === 'gated' ? diagnostic.required : null
            return (
              <li
                key={`${mode}-${diagnostic.path}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono" title={diagnostic.path}>
                    {diagnostic.path}
                  </p>
                  <p className="mt-1 text-muted-foreground capitalize">
                    {mode}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p>measured {formatValue(diagnostic.measured, format)}</p>
                  <p className="mt-1 text-muted-foreground">
                    {required === null
                      ? 'required n/a'
                      : `required ${formatValue(required, format)}`}
                    {' · '}
                    <span
                      className={status === 'Fail' ? 'text-destructive' : ''}
                    >
                      {status}
                    </span>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function isStateDifference(
  diagnostic: ThemeDiagnostic,
): diagnostic is ButtonStateDifferenceDiagnostic {
  return (
    diagnostic.kind === 'gated' &&
    'rest' in diagnostic &&
    'state' in diagnostic &&
    diagnostic.property === 'background'
  )
}

function formatValue(value: number, format: 'contrast' | 'difference') {
  return format === 'contrast' ? `${value}:1` : String(value)
}
