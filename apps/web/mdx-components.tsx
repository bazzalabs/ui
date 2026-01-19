import { ConstructionIcon, LinkIcon } from 'lucide-react'
import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import { IssuesTableWrapper } from '@/app/demos/client/tst-static/_/issues-table-wrapper'
import { BaseUIReference } from '@/components/base-ui-reference'
import { CssVarsTable } from '@/components/css-vars-table'
import { DataAttrsTable } from '@/components/data-attrs-table'
import { TypeDebug } from '@/components/type-debug'
import { TypeDiff } from '@/components/type-diff'
import { TypeReference } from '@/components/type-reference'
import { TypeSignature } from '@/components/type-signature'
import { TypeTable } from '@/components/type-table'
import { StateTableAuto, TypeTableAuto } from '@/components/type-table-auto'
import { cn } from '@/lib/utils'
import CodeInline from './components/code-inline'
import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from './components/codeblock'
import CollapsibleCodeBlock from './components/collapsible-code-block'
import ComponentCode from './components/component-code'
import { ComponentFrame } from './components/component-frame'
import { ComponentPreview } from './components/component-preview'
import { ComponentsList } from './components/components-list'
import { Examples } from './components/examples'
import { Media } from './components/media'
import PropRow from './components/prop-row'
import { PropsTable } from './components/props-table'
import { ResponsiveImage } from './components/responsive-image'

const HeadingAnchor = ({
  id,
  children,
  iconClassName,
}: {
  id: string
  children?: React.ReactNode
  iconClassName?: string
}) => (
  <a href={`#${id}`} className="flex items-center gap-3 group">
    {children}
    <LinkIcon
      className={cn(
        'size-4 text-muted-foreground/50 inline align-middle group-hover:text-muted-foreground pointer-events-none',
        iconClassName,
      )}
    />
  </a>
)

const components = {
  h1: (props) => (
    <h2 className={cn('text-2xl mt-4', props.className)} {...props} />
  ),
  h2: ({ children, className, ...props }) => {
    return (
      <h2
        className={cn(
          'text-3xl font-semibold tracking-[-0.02em] drop-shadow-xs first:mt-0 mt-20 mb-8',
          '[&>code]:text-2xl',
          className,
        )}
        {...props}
      >
        {props.id ? (
          <HeadingAnchor id={props.id}>{children}</HeadingAnchor>
        ) : (
          children
        )}
      </h2>
    )
  },
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn(
        'group/heading text-2xl font-semibold tracking-[-0.02em] mt-18 mb-6 [&>a]:no-underline flex items-center gap-2',
        '[&>code]:text-xl',
        className,
      )}
      {...props}
    >
      {props.id ? (
        <HeadingAnchor id={props.id} iconClassName="size-3.5">
          {children}
        </HeadingAnchor>
      ) : (
        children
      )}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4
      className={cn(
        'text-xl font-semibold tracking-[-0.02em] mt-16 mb-6 [&>a]:no-underline flex items-center gap-2',
        '[&>code]:text-lg',
        className,
      )}
      {...props}
    >
      {props.id ? (
        <HeadingAnchor id={props.id} iconClassName="size-3">
          {children}
        </HeadingAnchor>
      ) : (
        children
      )}
    </h4>
  ),
  h5: ({ children, className, ...props }) => (
    <h5
      className={cn(
        'text-lg font-semibold tracking-[-0.01em] mt-14 mb-4',
        '[&>code]:text-base',
        className,
      )}
      {...props}
    >
      {props.id ? (
        <HeadingAnchor id={props.id} iconClassName="size-3">
          {children}
        </HeadingAnchor>
      ) : (
        children
      )}
    </h5>
  ),
  h6: (props) => <h6 {...props} />,
  p: (props) => (
    <p className="mb-4 last:mb-0 leading-7 text-primary/80" {...props} />
  ),
  a: (props) => (
    <a
      className="underline decoration-[0.5px] underline-offset-2 decoration-inherit hover:decoration-primary hover:decoration-[1px] hover:underline-offset-[2.25px]"
      {...props}
    />
  ),
  u: (props) => <u className="underline underline-offset-2" {...props} />,
  strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong
      className={cn(
        'font-medium text-primary has-[code]:font-semibold',
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        'my-6 ml-6 list-disc [&>li>ul]:my-2 [&>li>ul]:ml-4',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        'my-6 ml-6 list-decimal [&>li>ol]:my-2 [&>li>ol]:ml-4 [&>li>ol]:list-lower-alpha [&>li>ol>li>ol]:list-lower-roman',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('mt-2 text-primary/80', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className={cn(
        'mt-6 mb-6 border-l-4 border-neutral-400 dark:border-neutral-600 rounded-md px-6 py-4 [&_code]:not-italic [&_code]:border-[0.5px] bg-accent/30 italic text-neutral-700 dark:text-neutral-300',
        className,
      )}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/performance/noImgElement: its fine
    <img className={cn('rounded-md', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-4 md:my-8" {...props} />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto bg-background rounded-lg border shadow-xs">
      <table
        className={cn('relative w-full overflow-hidden text-sm', className)}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn('last:border-b-none m-0 border-b', className)}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        'bg-muted px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        'px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'relative rounded-sm bg-muted px-1 py-0.5 font-mono text-sm border inset-shadow-xs',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ ref: _ref, className, ...props }) => (
    <CodeBlock {...props} className={cn(className)}>
      <Pre
        className={cn(
          'bg-background overflow-scroll w-full [&_code]:!text-sm',
          '[&_code]:bg-transparent [&_code]:rounded-none [&_code]:px-0 [&_code]:py-0 [&_code]:text-inherit [&_code]:border-none [&_code]:inset-shadow-none',
          '[&>code]:!w-full [&>code]:flex [&>code]:flex-col',
          '[&_code_span.line]:px-4 [&_code_span.line]:h-6 [&_code_span.line]:flex [&_code_span.line]:items-center',
          '[&_code_span.line.highlighted]:bg-muted/75 [&_code_span.line.highlighted]:relative [&_code_span.line.highlighted]:before:absolute [&_code_span.line.highlighted]:before:inset-0 [&_code_span.line.highlighted]:before:border-l-3 [&_code_span.line.highlighted]:before:border-l-neutral-400',
        )}
      >
        {props.children}
      </Pre>
    </CodeBlock>
  ),
  // pre: ({ children, className, ...props }) => (
  //   <pre
  //     className={cn(
  //       'bg-white dark:bg-neutral-900 overflow-scroll w-full rounded-lg border [&_code]:!text-sm my-6 py-4',
  //       '[&_code]:bg-transparent [&_code]:rounded-none [&_code]:px-0 [&_code]:py-0 [&_code]:text-inherit [&_code]:border-none [&_code]:inset-shadow-none',
  //       '[&>code]:!w-full [&>code]:flex [&>code]:flex-col',
  //       '[&_code_span.line]:px-4 [&_code_span.line]:h-6 [&_code_span.line]:flex [&_code_span.line]:items-center',
  //       '[&_code_span.line.highlighted]:bg-muted/75 [&_code_span.line.highlighted]:relative [&_code_span.line.highlighted]:before:absolute [&_code_span.line.highlighted]:before:inset-0 [&_code_span.line.highlighted]:before:border-l-3 [&_code_span.line.highlighted]:before:border-l-neutral-400',
  //       className,
  //     )}
  //     {...props}
  //   >
  //     {children}
  //   </pre>
  // ),
  Image,
  ResponsiveImage: (props) => (
    <ResponsiveImage
      wrapperClassName={cn('my-6', props.wrapperClassName)}
      {...props}
    />
  ),
  CollapsibleCodeBlock,
  TypeTable,
  TypeReference,
  TypeTableAuto,
  StateTableAuto,
  TypeSignature,
  BaseUIReference,
  TypeDebug,
  TypeDiff,
  DataAttrsTable,
  CssVarsTable,
  IssuesTableWrapper,
  // @ts-expect-error
  Examples,
  ComponentPreview: ({ className, ...props }) => (
    <ComponentPreview className={cn('my-6', className)} {...props} />
  ),
  ComponentCode: ComponentCode,
  ComponentFrame,
  CodeInline,
  PropRow,
  PropsTable,
  ComponentsList,
  Media: ({ figureClassName, ...props }) => (
    <Media figureClassName={cn('my-6', figureClassName)} {...props} />
  ),
  PageUnderConstruction: () => {
    return (
      <div className="w-fit p-8 mx-auto mt-24 flex flex-col justify-center items-center gap-8 border shadow-xs rounded-lg">
        <ConstructionIcon className="size-24 text-orange-500" />
        <div className="flex flex-col gap-2 items-center">
          <span className="text-base font-medium text-primary">
            This page is under construction.
          </span>
          <span className="text-muted-foreground text-sm">
            Please check back again later.
          </span>
        </div>
        {/*<h2
            className={cn(
              'text-xl font-medium tracking-[-0.02em] drop-shadow-xs first:mt-0 mt-20 mb-8 text-muted-foreground',
              '[&>code]:text-2xl',
            )}
          >
            Under construction
          </h2>*/}
      </div>
    )
  },
  CodeBlockTabs: CodeBlockTabs,
  CodeBlockTabsList: CodeBlockTabsList,
  CodeBlockTabsTrigger: CodeBlockTabsTrigger,
  CodeBlockTab,
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components as any
}
