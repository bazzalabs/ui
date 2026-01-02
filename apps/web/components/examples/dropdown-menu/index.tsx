import { DropdownMenu_AIModelSwitcher } from './ai-model-switcher'
import { DropdownMenuV2_Basic } from './v2/basic'
import { DropdownMenu_AsyncBasic } from './async-basic'
import { DropdownMenu_AsyncDeepSearch } from './async-deep-search'
import { DropdownMenu_AsyncSubmenusStreaming } from './async-submenus-streaming'
import { DropdownMenu_Basic } from './basic'
import { DropdownMenu_CheckboxItems } from './checkbox-items'
import { DropdownMenu_DisabledItems } from './disabled-items'
import { DropdownMenu_Groups } from './groups'
import { DropdownMenu_HeaderFooter } from './header-footer'
import { DropdownMenu_HiddenItems } from './hidden-items'
import { DropdownMenu_ItemDescriptions } from './item-descriptions'
import { DropdownMenu_Linear } from './linear'
import { DropdownMenu_LinearAsync } from './linear-async'
import { DropdownMenu_Massive } from './massive'
import { DropdownMenu_Notion } from './notion'
import { DropdownMenu_PokemonNative } from './pokemon-native'
import { DropdownMenu_PokemonReactQuery } from './pokemon-react-query'
import { DropdownMenu_RadioGroups } from './radio-groups'
import { DropdownMenu_Submenus } from './submenus'
import { DropdownMenu_SubmenusCustomized } from './submenus-customized'
import { DropdownMenu_SubmenusDeep } from './submenus-deep'

export const DropdownMenu = {
  Basic: DropdownMenu_Basic,
  DisabledItems: DropdownMenu_DisabledItems,
  HiddenItems: DropdownMenu_HiddenItems,
  CheckboxItems: DropdownMenu_CheckboxItems,
  Groups: DropdownMenu_Groups,
  RadioGroups: DropdownMenu_RadioGroups,
  Massive: DropdownMenu_Massive,
  ItemDescriptions: DropdownMenu_ItemDescriptions,
  Submenus: DropdownMenu_Submenus,
  SubmenusDeep: DropdownMenu_SubmenusDeep,
  SubmenusCustomized: DropdownMenu_SubmenusCustomized,
  HeaderFooter: DropdownMenu_HeaderFooter,
  /** Async */
  AsyncBasic: DropdownMenu_AsyncBasic,
  // AsyncSubmenus: DropdownMenu_AsyncSubmenus,
  AsyncDeepSearch: DropdownMenu_AsyncDeepSearch,
  AsyncSubmenusStreaming: DropdownMenu_AsyncSubmenusStreaming,
  PokemonReactQuery: DropdownMenu_PokemonReactQuery,
  PokemonNative: DropdownMenu_PokemonNative,
  /***** Kitchen sink examples *****/
  Linear: DropdownMenu_Linear,
  LinearAsync: DropdownMenu_LinearAsync,
  Notion: DropdownMenu_Notion,
  AIModelSwitcher: DropdownMenu_AIModelSwitcher,
}
