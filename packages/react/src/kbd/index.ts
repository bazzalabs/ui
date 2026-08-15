export * as Kbd from './index.parts.js'
export type { Keybinding, KeyChord } from './utils/parse-keybinding.js'
export {
  getChordLabels,
  getKeyLabel,
  parseKeybinding,
} from './utils/parse-keybinding.js'
export { isApplePlatform, usePlatform } from './utils/platform.js'
