'use client'

// import { useRow } from '@bazza-ui/action-menu'
import { ChevronRightIcon } from 'lucide-react'
import { cloneElement, Fragment, isValidElement } from 'react'
import { NavBar } from '@/components/nav-bar'
import { ActionMenu } from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Iconish, type MenuNode, properties } from './items'

function IconSlot({ icon, className }: { icon?: Iconish; className?: string }) {
  if (!icon) return null
  if (isValidElement(icon)) {
    const el = icon as React.ReactElement<any>
    return cloneElement(el, {
      className: cn(className, el.props.className),
    })
  }
  const Cmp = icon as React.ComponentType<any>
  return <Cmp className={className} />
}

const Row = ({ label, icon }: { label: string; icon: Iconish }) => {
  const ctx = useRow()

  return (
    <div className="flex items-center gap-2">
      <IconSlot icon={icon} />
      <div className="flex items-center gap-1">
        {ctx.breadcrumbs.map((crumb) => {
          return (
            <Fragment key={crumb}>
              <span className="text-muted-foreground">{crumb}</span>
              <ChevronRightIcon className="size-3 text-muted-foreground/70" />
            </Fragment>
          )
        })}
        <span>{label}</span>
      </div>
    </div>
  )
}

export function renderMenu(nodes: MenuNode[]) {
  return nodes.map((node) => {
    switch (node.kind) {
      case 'item': {
        const value = node.value ?? node.id
        return (
          <ActionMenu.Item
            key={node.id}
            value={value}
            keywords={node.keywords ?? (node.label ? [node.label] : undefined)}
            disabled={node.disabled}
            onSelect={(v) => node.onSelect?.(v, node)}
            className="group"
          >
            <Row icon={node.icon} label={node.label ?? value} />
          </ActionMenu.Item>
        )
      }
      case 'submenu':
        return (
          <ActionMenu.Sub key={node.id}>
            <ActionMenu.SubTrigger
              value={node.label ?? node.id}
              keywords={
                node.keywords ?? (node.label ? [node.label] : undefined)
              }
              disabled={node.disabled}
              className="group"
            >
              <Row icon={node.icon} label={node.label ?? node.id} />
            </ActionMenu.SubTrigger>

            <ActionMenu.SubContent title={node.label ?? node.id}>
              <ActionMenu.Input placeholder={`${node.label ?? node.id}...`} />
              <ActionMenu.List>{renderMenu(node.children)}</ActionMenu.List>
            </ActionMenu.SubContent>
          </ActionMenu.Sub>
        )
      default:
        return null
    }
  })
}

export default function Page() {
  return (
    <div className="flex flex-col h-full flex-1">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8 p-8">
            <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
              Action Menu
            </h1>
          </div>
        </div>
      </div>

      <div className="border-b border-border border-dashed bg-site-background flex-1 flex flex-col">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x flex-1">
          <div className="flex flex-col gap-8 p-8">
            <ActionMenu.Root>
              <ActionMenu.Trigger asChild>
                <Button variant="ghost" size="sm">
                  <svg
                    className="fill-muted-foreground size-4"
                    viewBox="0 0 16 16"
                    role="img"
                    focusable="false"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14.25 3a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5h12.5ZM4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Zm2.75 3.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"
                    ></path>
                  </svg>
                  Filter
                </Button>
              </ActionMenu.Trigger>
              <ActionMenu.Content>
                <ActionMenu.Input placeholder="Filter..." />
                <ActionMenu.List>
                  {renderMenu(properties)}
                  {/* {properties.map((property) => { */}
                  {/*   if (property.items) { */}
                  {/*     const Icon = property.icon */}
                  {/*     return ( */}
                  {/*       <ActionMenu.Sub key={property.id}> */}
                  {/*         <ActionMenu.SubTrigger */}
                  {/*           value={property.id} */}
                  {/*           keywords={[property.label]} */}
                  {/*         > */}
                  {/*           <Row label={property.label} icon={<Icon />} /> */}
                  {/*         </ActionMenu.SubTrigger> */}
                  {/*         <ActionMenu.SubContent title={property.label}> */}
                  {/*           <ActionMenu.Input */}
                  {/*             placeholder={`${property.label}...`} */}
                  {/*           /> */}
                  {/*           <ActionMenu.List> */}
                  {/*             {property.items.map((item) => { */}
                  {/*               const Icon = item.icon */}
                  {/*               return ( */}
                  {/*                 <ActionMenu.Item */}
                  {/*                   key={item.id} */}
                  {/*                   value={item.id} */}
                  {/*                   keywords={[item.label]} */}
                  {/*                 > */}
                  {/*                   <Row label={item.label} icon={Icon} /> */}
                  {/*                 </ActionMenu.Item> */}
                  {/*               ) */}
                  {/*             })} */}
                  {/*           </ActionMenu.List> */}
                  {/*         </ActionMenu.SubContent> */}
                  {/*       </ActionMenu.Sub> */}
                  {/*     ) */}
                  {/*   } */}
                  {/**/}
                  {/*   return null */}
                  {/* })} */}
                </ActionMenu.List>
              </ActionMenu.Content>
            </ActionMenu.Root>
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x h-16"></div>
      </div>
    </div>
  )
}
