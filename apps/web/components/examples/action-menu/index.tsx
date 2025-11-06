import { ActionMenu_Basic } from './basic'
import { ActionMenu_CheckboxItems } from './checkbox-items'
import { ActionMenu_DisabledItems } from './disabled-items'
import { ActionMenu_HeaderFooter } from './header-footer'
import { ActionMenu_KitchenSink01 } from './kitchen-sink-01'
import { ActionMenu_Massive } from './massive'
import { ActionMenu_Notion } from './notion'
import { ActionMenu_RadioGroups } from './radio-groups'
import { ActionMenu_Submenus } from './submenus'
import { ActionMenu_SubmenusCustomized } from './submenus-customized'
import { ActionMenu_SubmenusDeep } from './submenus-deep'

export const ActionMenu = {
  Basic: ActionMenu_Basic,
  DisabledItems: ActionMenu_DisabledItems,
  CheckboxItems: ActionMenu_CheckboxItems,
  RadioGroups: ActionMenu_RadioGroups,
  Massive: ActionMenu_Massive,
  Submenus: ActionMenu_Submenus,
  SubmenusDeep: ActionMenu_SubmenusDeep,
  SubmenusCustomized: ActionMenu_SubmenusCustomized,
  HeaderFooter: ActionMenu_HeaderFooter,
  /***** Kitchen sink examples *****/
  KitchenSink01: ActionMenu_KitchenSink01,
  Notion: ActionMenu_Notion,
}
