import { ActionMenu_AIModelSwitcher } from './ai-model-switcher'
import { ActionMenu_AsyncBasic } from './async-basic'
import { ActionMenu_AsyncDeepSearch } from './async-deep-search'
import { ActionMenu_AsyncSubmenus } from './async-submenus'
import { ActionMenu_Basic } from './basic'
import { ActionMenu_CheckboxItems } from './checkbox-items'
import { ActionMenu_DisabledItems } from './disabled-items'
import { ActionMenu_Groups } from './groups'
import { ActionMenu_HeaderFooter } from './header-footer'
import { ActionMenu_ItemDescriptions } from './item-descriptions'
import { ActionMenu_Linear } from './linear'
import { ActionMenu_LinearAsync } from './linear-async'
import { ActionMenu_Massive } from './massive'
import { ActionMenu_Notion } from './notion'
import { ActionMenu_PokemonNative } from './pokemon-native'
import { ActionMenu_PokemonReactQuery } from './pokemon-react-query'
import { ActionMenu_RadioGroups } from './radio-groups'
import { ActionMenu_Submenus } from './submenus'
import { ActionMenu_SubmenusCustomized } from './submenus-customized'
import { ActionMenu_SubmenusDeep } from './submenus-deep'

export const ActionMenu = {
  Basic: ActionMenu_Basic,
  DisabledItems: ActionMenu_DisabledItems,
  CheckboxItems: ActionMenu_CheckboxItems,
  Groups: ActionMenu_Groups,
  RadioGroups: ActionMenu_RadioGroups,
  Massive: ActionMenu_Massive,
  ItemDescriptions: ActionMenu_ItemDescriptions,
  Submenus: ActionMenu_Submenus,
  SubmenusDeep: ActionMenu_SubmenusDeep,
  SubmenusCustomized: ActionMenu_SubmenusCustomized,
  HeaderFooter: ActionMenu_HeaderFooter,
  /** Async */
  AsyncBasic: ActionMenu_AsyncBasic,
  AsyncSubmenus: ActionMenu_AsyncSubmenus,
  AsyncDeepSearch: ActionMenu_AsyncDeepSearch,
  PokemonReactQuery: ActionMenu_PokemonReactQuery,
  PokemonNative: ActionMenu_PokemonNative,
  /***** Kitchen sink examples *****/
  Linear: ActionMenu_Linear,
  LinearAsync: ActionMenu_LinearAsync,
  Notion: ActionMenu_Notion,
  AIModelSwitcher: ActionMenu_AIModelSwitcher,
}
