import { ContextMenu_AIModelSwitcher } from './ai-model-switcher'
import { ContextMenu_AsyncBasic } from './async-basic'
import { ContextMenu_AsyncDeepSearch } from './async-deep-search'
import { ContextMenu_AsyncSubmenusStreaming } from './async-submenus-streaming'
import { ContextMenu_Basic } from './basic'
import { ContextMenu_CheckboxItems } from './checkbox-items'
import { ContextMenu_DisabledItems } from './disabled-items'
import { ContextMenu_Groups } from './groups'
import { ContextMenu_HeaderFooter } from './header-footer'
import { ContextMenu_ItemDescriptions } from './item-descriptions'
import { ContextMenu_Linear } from './linear'
import { ContextMenu_LinearAsync } from './linear-async'
import { ContextMenu_Massive } from './massive'
import { ContextMenu_Notion } from './notion'
import { ContextMenu_PokemonNative } from './pokemon-native'
import { ContextMenu_PokemonReactQuery } from './pokemon-react-query'
import { ContextMenu_RadioGroups } from './radio-groups'
import { ContextMenu_Submenus } from './submenus'
import { ContextMenu_SubmenusCustomized } from './submenus-customized'
import { ContextMenu_SubmenusDeep } from './submenus-deep'

export const ContextMenu = {
  Basic: ContextMenu_Basic,
  DisabledItems: ContextMenu_DisabledItems,
  CheckboxItems: ContextMenu_CheckboxItems,
  Groups: ContextMenu_Groups,
  RadioGroups: ContextMenu_RadioGroups,
  Massive: ContextMenu_Massive,
  ItemDescriptions: ContextMenu_ItemDescriptions,
  Submenus: ContextMenu_Submenus,
  SubmenusDeep: ContextMenu_SubmenusDeep,
  SubmenusCustomized: ContextMenu_SubmenusCustomized,
  HeaderFooter: ContextMenu_HeaderFooter,
  /** Async */
  AsyncBasic: ContextMenu_AsyncBasic,
  AsyncDeepSearch: ContextMenu_AsyncDeepSearch,
  AsyncSubmenusStreaming: ContextMenu_AsyncSubmenusStreaming,
  PokemonReactQuery: ContextMenu_PokemonReactQuery,
  PokemonNative: ContextMenu_PokemonNative,
  /***** Kitchen sink examples *****/
  Linear: ContextMenu_Linear,
  LinearAsync: ContextMenu_LinearAsync,
  Notion: ContextMenu_Notion,
  AIModelSwitcher: ContextMenu_AIModelSwitcher,
}
