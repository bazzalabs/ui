import { Examples } from '@/components/examples'
import { MultiSelect } from '@/components/examples/action-menu/multiselect'

export function Playground() {
  return (
    <div className="flex flex-col gap-8 [&_[data-slot=action-menu-trigger]]:!w-fit">
      {/*<Examples.ActionMenu.PokemonNative />
      <Examples.ActionMenu.PokemonReactQuery />
      <Examples.ActionMenu.AsyncBasic />*/}
      <Examples.ActionMenu.AsyncSubmenusStreaming />
      {/*<Examples.ActionMenu.AsyncDeepSearch />
      <Examples.ActionMenu.ItemDescriptions />
      <Examples.ActionMenu.AIModelSwitcher />
      <Examples.ActionMenu.Basic />
      <Examples.ActionMenu.Submenus />
      <Examples.ActionMenu.Linear />
      <Examples.ActionMenu.LinearAsync />
      <Examples.ActionMenu.Notion />
      <Examples.ActionMenu.HeaderFooter />
      <Examples.ActionMenu.RadioGroups />
      <Examples.ActionMenu.CheckboxItems />
      <Examples.ActionMenu.Massive numItems={10_000} />
      <Examples.ActionMenu.SubmenusDeep />
      <MultiSelect
        items={[
          { kind: 'item', label: 'Option 1', id: 'option1' },
          { kind: 'item', label: 'Option 2', id: 'option2' },
          { kind: 'item', label: 'Option 3', id: 'option3' },
        ]}
      />*/}
    </div>
  )
}
