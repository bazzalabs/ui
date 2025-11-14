/** biome-ignore-all lint/correctness/useUniqueElementIds: not needed */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: needed for nested button */
'use client'

import {
  flatten,
  type ItemDef,
  type ItemSlotProps,
  type NodeDef,
  renderIcon,
} from '@bazza-ui/action-menu'
import { BrainIcon, CheckIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu, LabelWithBreadcrumbs } from '@/registry/action-menu'

const createAIProviderMenu = ({
  id,
  label,
  icon,
  models,
  setValue,
}: {
  id: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  models: Omit<ItemDef, 'kind'>[]
  setValue: (value: string) => void
}): NodeDef => ({
  kind: 'submenu',
  id,
  label,
  icon,
  defaults: {
    item: {
      closeOnSelect: true,
      onSelect: ({ node }) => {
        setValue(node.id)
        toast(`Switched model to ${node.label}.`, {
          icon: renderIcon(node.icon, 'size-4'),
        })
      },
    },
  },
  nodes: models.map((model) => ({ ...model, kind: 'item', icon })) as ItemDef[],
})

export function ActionMenu_AIModelSwitcher() {
  const [value, setValue] = useState<string | undefined>(undefined)
  const nodes: NodeDef[] = useMemo(
    () => [
      createAIProviderMenu({
        id: 'openai',
        label: 'OpenAI',
        icon: OpenAIIcon,
        models: [
          {
            id: 'gpt-4-turbo',
            label: 'GPT-4 Turbo',
            description: 'Most capable model, optimized for speed',
          },
          {
            id: 'gpt-4',
            label: 'GPT-4',
            description: 'Advanced reasoning and complex tasks',
          },
          {
            id: 'gpt-3.5-turbo',
            label: 'GPT-3.5 Turbo',
            description: 'Fast and cost-effective for simple tasks',
          },
        ],
        setValue,
      }),
      createAIProviderMenu({
        id: 'anthropic',
        label: 'Anthropic',
        icon: AnthropicIcon,
        models: [
          {
            id: 'claude-3.5-sonnet',
            label: 'Claude 3.5 Sonnet',
            description: 'Best balance of speed and intelligence',
          },
          {
            id: 'claude-3-opus',
            label: 'Claude 3 Opus',
            description: 'Most powerful for complex analysis',
          },
          {
            id: 'claude-3-haiku',
            label: 'Claude 3 Haiku',
            description: 'Fastest responses for simple queries',
          },
        ],
        setValue,
      }),
      createAIProviderMenu({
        id: 'google',
        label: 'Google',
        icon: GeminiIcon,
        models: [
          {
            id: 'gemini-1.5-pro',
            label: 'Gemini 1.5 Pro',
            description: 'Long context window, multimodal reasoning',
          },
          {
            id: 'gemini-1.5-flash',
            label: 'Gemini 1.5 Flash',
            description: 'High-speed multimodal responses',
          },
          {
            id: 'gemini-pro',
            label: 'Gemini Pro',
            description: 'Versatile model for various tasks',
          },
        ],
        setValue,
      }),
      createAIProviderMenu({
        id: 'meta',
        label: 'Meta',
        icon: MetaIcon,
        models: [
          {
            id: 'llama-3.1-405b',
            label: 'Llama 3.1 405B',
            description: 'Largest open-source model available',
          },
          {
            id: 'llama-3.1-70b',
            label: 'Llama 3.1 70B',
            description: 'Balanced performance and efficiency',
          },
          {
            id: 'llama-3-8b',
            label: 'Llama 3 8B',
            description: 'Compact model for edge deployment',
          },
        ],
        setValue,
      }),
      createAIProviderMenu({
        id: 'mistral',
        label: 'Mistral AI',
        icon: MistralIcon,
        models: [
          {
            id: 'mistral-large',
            label: 'Mistral Large',
            description: 'Top-tier reasoning and coding',
          },
          {
            id: 'mistral-medium',
            label: 'Mistral Medium',
            description: 'Balanced for general use cases',
          },
          {
            id: 'mistral-small',
            label: 'Mistral Small',
            description: 'Efficient for straightforward tasks',
          },
        ],
        setValue,
      }),
    ],
    [],
  )
  const flattenedNodes = useMemo(() => flatten(nodes, { deep: true }), [nodes])
  const selectedModel = useMemo(
    () =>
      value
        ? (flattenedNodes.find((node) => node.id === value) as ItemDef)
        : null,
    [value, flattenedNodes],
  )

  return (
    <ActionMenu
      slots={{
        // biome-ignore lint/correctness/noNestedComponentDefinitions: let it be!
        Item: (args) => <AIModelItem {...args} value={value} />,
      }}
      menu={{
        id: 'ai-models-submenu',
        inputPlaceholder: 'Choose a model...',
        nodes,
      }}
    >
      <ActionMenu.Trigger asChild>
        <Button variant="secondary" className="group w-fit">
          {selectedModel ? (
            <>
              {renderIcon(selectedModel.icon, 'size-4')}
              <span>{selectedModel.label}</span>
              <div
                className="text-muted-foreground hover:text-primary hover-expand-2 ml-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setValue(undefined)
                }}
              >
                <XIcon />
              </div>
            </>
          ) : (
            <>
              <BrainIcon className="text-muted-foreground" />
              <span className="text-muted-foreground group-hover:text-primary group-aria-expanded:text-primary">
                Select model
              </span>
            </>
          )}
        </Button>
      </ActionMenu.Trigger>
    </ActionMenu>
  )
}

const AIModelItem = ({
  node,
  bind,
  search,
  value,
}: ItemSlotProps & { value?: string }) => {
  const props = bind.getRowProps({
    className: cn(
      'group/row',
      node.description && 'gap-3 data-[mode=dropdown]:px-0',
    ),
  })

  return (
    <li {...props}>
      {node.icon && (
        <div className="size-4 flex items-center justify-center">
          {renderIcon(
            node.icon,
            'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
          )}
        </div>
      )}
      <div className="flex flex-col mr-4">
        <LabelWithBreadcrumbs
          label={node.label ?? ''}
          breadcrumbs={search?.breadcrumbs}
        />
        {node.description && (
          <span className="text-muted-foreground text-xs truncate">
            {node.description}
          </span>
        )}
      </div>
      {value === node.id && <CheckIcon className="size-4 ml-auto" />}
    </li>
  )
}

const OpenAIIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="256"
    height="260"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 260"
    fill="currentColor"
    {...props}
  >
    <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
  </svg>
)

const AnthropicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    fillRule="evenodd"
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Anthropic</title>
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"></path>
  </svg>
)

const GeminiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 296 298"
    xmlns="http://www.w3.org/2000/svg"
    width="296"
    height="298"
    fill="none"
    {...props}
  >
    <mask
      id="gemini-a"
      width="296"
      height="298"
      x="0"
      y="0"
      maskUnits="userSpaceOnUse"
      style={{ maskType: 'alpha' }}
    >
      <path
        fill="#3186FF"
        d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
      />
    </mask>
    <g mask="url(#gemini-a)">
      <g filter="url(#gemini-b)">
        <ellipse cx="163" cy="149" fill="#3689FF" rx="196" ry="159" />
      </g>
      <g filter="url(#gemini-c)">
        <ellipse cx="33.5" cy="142.5" fill="#F6C013" rx="68.5" ry="72.5" />
      </g>
      <g filter="url(#gemini-d)">
        <ellipse cx="19.5" cy="148.5" fill="#F6C013" rx="68.5" ry="72.5" />
      </g>
      <g filter="url(#gemini-e)">
        <path
          fill="#FA4340"
          d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z"
        />
      </g>
      <g filter="url(#gemini-f)">
        <path
          fill="#FA4340"
          d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z"
        />
      </g>
      <g filter="url(#gemini-g)">
        <path
          fill="#14BB69"
          d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z"
        />
      </g>
      <g filter="url(#gemini-h)">
        <path
          fill="#14BB69"
          d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z"
        />
      </g>
    </g>
    <defs>
      <filter
        id="gemini-b"
        width="464"
        height="390"
        x="-69"
        y="-46"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="18"
        />
      </filter>
      <filter
        id="gemini-c"
        width="265"
        height="273"
        x="-99"
        y="6"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
      <filter
        id="gemini-d"
        width="265"
        height="273"
        x="-113"
        y="12"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
      <filter
        id="gemini-e"
        width="299.5"
        height="329"
        x="-41.5"
        y="-130"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
      <filter
        id="gemini-f"
        width="299.5"
        height="329"
        x="-45"
        y="-153"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
      <filter
        id="gemini-g"
        width="299.5"
        height="329"
        x="-41"
        y="91"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
      <filter
        id="gemini-h"
        width="299.5"
        height="329"
        x="-39"
        y="132"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_69_17998"
          stdDeviation="32"
        />
      </filter>
    </defs>
  </svg>
)

const MetaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="256"
    height="171"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 171"
    {...props}
  >
    <defs>
      <linearGradient
        id="meta-a"
        x1="13.878%"
        x2="89.144%"
        y1="55.934%"
        y2="58.694%"
      >
        <stop offset="0%" stopColor="#0064E1" />
        <stop offset="40%" stopColor="#0064E1" />
        <stop offset="83%" stopColor="#0073EE" />
        <stop offset="100%" stopColor="#0082FB" />
      </linearGradient>
      <linearGradient
        id="meta-b"
        x1="54.315%"
        x2="54.315%"
        y1="82.782%"
        y2="39.307%"
      >
        <stop offset="0%" stopColor="#0082FB" />
        <stop offset="100%" stopColor="#0064E0" />
      </linearGradient>
    </defs>
    <path
      fill="#0081FB"
      d="M27.651 112.136c0 9.775 2.146 17.28 4.95 21.82 3.677 5.947 9.16 8.466 14.751 8.466 7.211 0 13.808-1.79 26.52-19.372 10.185-14.092 22.186-33.874 30.26-46.275l13.675-21.01c9.499-14.591 20.493-30.811 33.1-41.806C161.196 4.985 172.298 0 183.47 0c18.758 0 36.625 10.87 50.3 31.257C248.735 53.584 256 81.707 256 110.729c0 17.253-3.4 29.93-9.187 39.946-5.591 9.686-16.488 19.363-34.818 19.363v-27.616c15.695 0 19.612-14.422 19.612-30.927 0-23.52-5.484-49.623-17.564-68.273-8.574-13.23-19.684-21.313-31.907-21.313-13.22 0-23.859 9.97-35.815 27.75-6.356 9.445-12.882 20.956-20.208 33.944l-8.066 14.289c-16.203 28.728-20.307 35.271-28.408 46.07-14.2 18.91-26.324 26.076-42.287 26.076-18.935 0-30.91-8.2-38.325-20.556C2.973 139.413 0 126.202 0 111.148l27.651.988Z"
    />
    <path
      fill="url(#meta-a)"
      d="M21.802 33.206C34.48 13.666 52.774 0 73.757 0 85.91 0 97.99 3.597 110.605 13.897c13.798 11.261 28.505 29.805 46.853 60.368l6.58 10.967c15.881 26.459 24.917 40.07 30.205 46.49 6.802 8.243 11.565 10.7 17.752 10.7 15.695 0 19.612-14.422 19.612-30.927l24.393-.766c0 17.253-3.4 29.93-9.187 39.946-5.591 9.686-16.488 19.363-34.818 19.363-11.395 0-21.49-2.475-32.654-13.007-8.582-8.083-18.615-22.443-26.334-35.352l-22.96-38.352C118.528 64.08 107.96 49.73 101.845 43.23c-6.578-6.988-15.036-15.428-28.532-15.428-10.923 0-20.2 7.666-27.963 19.39L21.802 33.206Z"
    />
    <path
      fill="url(#meta-b)"
      d="M73.312 27.802c-10.923 0-20.2 7.666-27.963 19.39-10.976 16.568-17.698 41.245-17.698 64.944 0 9.775 2.146 17.28 4.95 21.82L9.027 149.482C2.973 139.413 0 126.202 0 111.148 0 83.772 7.514 55.24 21.802 33.206 34.48 13.666 52.774 0 73.757 0l-.445 27.802Z"
    />
  </svg>
)

const MistralIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 233"
    {...props}
  >
    <path d="M186.18182 0h46.54545v46.54545h-46.54545z" />
    <path fill="#F7D046" d="M209.45454 0h46.54545v46.54545h-46.54545z" />
    <path d="M0 0h46.54545v46.54545H0zM0 46.54545h46.54545V93.0909H0zM0 93.09091h46.54545v46.54545H0zM0 139.63636h46.54545v46.54545H0zM0 186.18182h46.54545v46.54545H0z" />
    <path fill="#F7D046" d="M23.27273 0h46.54545v46.54545H23.27273z" />
    <path
      fill="#F2A73B"
      d="M209.45454 46.54545h46.54545V93.0909h-46.54545zM23.27273 46.54545h46.54545V93.0909H23.27273z"
    />
    <path d="M139.63636 46.54545h46.54545V93.0909h-46.54545z" />
    <path
      fill="#F2A73B"
      d="M162.90909 46.54545h46.54545V93.0909h-46.54545zM69.81818 46.54545h46.54545V93.0909H69.81818z"
    />
    <path
      fill="#EE792F"
      d="M116.36364 93.09091h46.54545v46.54545h-46.54545zM162.90909 93.09091h46.54545v46.54545h-46.54545zM69.81818 93.09091h46.54545v46.54545H69.81818z"
    />
    <path d="M93.09091 139.63636h46.54545v46.54545H93.09091z" />
    <path
      fill="#EB5829"
      d="M116.36364 139.63636h46.54545v46.54545h-46.54545z"
    />
    <path
      fill="#EE792F"
      d="M209.45454 93.09091h46.54545v46.54545h-46.54545zM23.27273 93.09091h46.54545v46.54545H23.27273z"
    />
    <path d="M186.18182 139.63636h46.54545v46.54545h-46.54545z" />
    <path
      fill="#EB5829"
      d="M209.45454 139.63636h46.54545v46.54545h-46.54545z"
    />
    <path d="M186.18182 186.18182h46.54545v46.54545h-46.54545z" />
    <path fill="#EB5829" d="M23.27273 139.63636h46.54545v46.54545H23.27273z" />
    <path
      fill="#EA3326"
      d="M209.45454 186.18182h46.54545v46.54545h-46.54545zM23.27273 186.18182h46.54545v46.54545H23.27273z"
    />
  </svg>
)
