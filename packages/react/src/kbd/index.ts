export type {
  Keybinding,
  KeyChord,
} from '../utils/keybinding/parse-keybinding.js'
export {
  getChordLabels,
  getKeyLabel,
  parseKeybinding,
} from '../utils/keybinding/parse-keybinding.js'
export { isApplePlatform, usePlatform } from '../utils/keybinding/platform.js'
export * as Kbd from './index.parts.js'
