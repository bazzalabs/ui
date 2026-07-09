# @bazza-ui/react

## 0.1.0-canary.8

### Patch Changes

- [#341](https://github.com/bazzalabs/ui/pull/341) [`e6dc2f0`](https://github.com/bazzalabs/ui/commit/e6dc2f0b9904e36d1994f8bccacc655f5476eff2) Thanks [@kianbazza](https://github.com/kianbazza)! - `Combobox.Clear` now forwards a consumer-provided `onPointerDown` handler instead of silently dropping it, while still preventing the button from stealing focus from the input.

- [#342](https://github.com/bazzalabs/ui/pull/342) [`856f7c6`](https://github.com/bazzalabs/ui/commit/856f7c634f24546478ac785ef086e99ab006e2ac) Thanks [@kianbazza](https://github.com/kianbazza)! - Pressing the popup-menu search input now always focuses it: surfaces no longer cancel pointerdown on inputs, and the input claims focus ownership for its surface on pointerdown.

- [#354](https://github.com/bazzalabs/ui/pull/354) [`9aff1da`](https://github.com/bazzalabs/ui/commit/9aff1daf160637fe0850bf48d8d61efc4a4a4629) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix submenus not reopening when the pointer re-enters the trigger after a hover-off close

- [#339](https://github.com/bazzalabs/ui/pull/339) [`d44a0e3`](https://github.com/bazzalabs/ui/commit/d44a0e3997c0d06081b379156fac19827046d43b) Thanks [@kianbazza](https://github.com/kianbazza)! - Consumer event handlers on `DropdownMenu.Trigger` and `Select.Trigger` now chain with internal handlers instead of replacing them. Opt out of the internal behavior with `event.preventBaseUIHandler()`.

## 0.1.0-canary.7

### Patch Changes

- [#308](https://github.com/bazzalabs/ui/pull/308) [`2cb28b7`](https://github.com/bazzalabs/ui/commit/2cb28b7cdd03a073f6af6092977de39c223ffb96) Thanks [@kianbazza](https://github.com/kianbazza)! - Bump `@base-ui/react` to `1.5.0` and `@base-ui/utils` to `0.2.9`.

- [#317](https://github.com/bazzalabs/ui/pull/317) [`1bc682c`](https://github.com/bazzalabs/ui/commit/1bc682c621202e0568271673191705fc8da44185) Thanks [@kianbazza](https://github.com/kianbazza)! - Assert expected ListboxStore warnings in tests to keep test output clean.

- [#320](https://github.com/bazzalabs/ui/pull/320) [`10cb2e3`](https://github.com/bazzalabs/ui/commit/10cb2e384fd658c8c2a8f03d1d4c9d7b65485655) Thanks [@kianbazza](https://github.com/kianbazza)! - Preserve dropdown menu row highlights until exit animations finish.

- [#329](https://github.com/bazzalabs/ui/pull/329) [`967a2cf`](https://github.com/bazzalabs/ui/commit/967a2cf1984b9ee4b985edf17c89dcea160417b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix `Select.Value` treating falsy-but-valid values (`0`, `false`, `''`) as empty and showing the placeholder. Select now uses a shared `isValueEmpty` helper so `Select.Value`, `Select.Trigger`, and `Select.Surface` agree on what counts as an empty selection, matching `Combobox`.

- [#319](https://github.com/bazzalabs/ui/pull/319) [`6f81c20`](https://github.com/bazzalabs/ui/commit/6f81c20bb2fbafef1ae67203204b51faa285a3d6) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix select popup positioning when aligning items with the trigger after the Base UI v1.5 positioning change.

- [#332](https://github.com/bazzalabs/ui/pull/332) [`a7fd8ae`](https://github.com/bazzalabs/ui/commit/a7fd8aeacab87124c398c2dd447a9ec13406d29e) Thanks [@kianbazza](https://github.com/kianbazza)! - Filtering is now diacritics-insensitive by default across all listbox-based components (Select, Combobox, menus). Unaccented queries match accented content and vice versa (e.g. `cafe` matches `café`, `sao` matches `São Paulo`). To opt out, pass a custom `filter`/`normalizeSearch` on `Select.Surface`.

- [#306](https://github.com/bazzalabs/ui/pull/306) [`8bf663d`](https://github.com/bazzalabs/ui/commit/8bf663db9b4d0542e21ab2ebf97bb776678d8eb0) Thanks [@kianbazza](https://github.com/kianbazza)! - Replace `DataList` children-as-function render prop with normal children and a
  `useDataList()` hook. List content now lives in child components that call
  `useDataList()`. This is a breaking change to the `DataList` API.

- [#304](https://github.com/bazzalabs/ui/pull/304) [`ba94100`](https://github.com/bazzalabs/ui/commit/ba94100ba468d7fe263ab9d9be1ed44dba7b7ca6) Thanks [@kianbazza](https://github.com/kianbazza)! - Add popup menu `resetScrollOnSearch` support and allow lists to provide a custom scroll container ref.

- [#303](https://github.com/bazzalabs/ui/pull/303) [`dab197d`](https://github.com/bazzalabs/ui/commit/dab197df8c390eee866d981723cf087578d0979c) Thanks [@kianbazza](https://github.com/kianbazza)! - Reset non-virtualized popup menu list scroll positions when the search query changes.

- [#326](https://github.com/bazzalabs/ui/pull/326) [`b962820`](https://github.com/bazzalabs/ui/commit/b96282045168424cf6fd76d9efd1f5590b4c71fa) Thanks [@kianbazza](https://github.com/kianbazza)! - `Select`: use standard anchored positioning for searchable popups. `alignItemWithTrigger` now applies only while no search input is present — a `Select.Input` (always-visible, or a `hideUntilActive` input once it activates) makes the popup fall back to anchored positioning, matching Base UI (Select aligns, Combobox anchors). Also stop recomputing the aligned placement when the visible item count changes while open.

- [#327](https://github.com/bazzalabs/ui/pull/327) [`5df1835`](https://github.com/bazzalabs/ui/commit/5df1835b63cece491ed4d35e9215fd85275f090e) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix `Select` with `clearSearchOnClose="after-exit"` not clearing the search or deactivating a `hideUntilActive` input after the close animation, which left the search input visible on reopen.

- [#331](https://github.com/bazzalabs/ui/pull/331) [`31a5f0e`](https://github.com/bazzalabs/ui/commit/31a5f0e60c67f6e147e7eb0c4bb4a61368aafef1) Thanks [@kianbazza](https://github.com/kianbazza)! - Support a clearable `null` item in `Select` and `Combobox` (Base UI parity). Rendering `<Select.Item value={null}>` (or describing it via `items` as `{ value: null, label }`) adds an option that clears the selection when chosen; its label is used as the trigger/input placeholder, and it shows as selected while there is no value. `Select.Item`/`Combobox.Item` now accept `value={null}`, and `onValueChange` may receive `null` when the selection is cleared.

- [#325](https://github.com/bazzalabs/ui/pull/325) [`6fe6994`](https://github.com/bazzalabs/ui/commit/6fe6994adcb2a07ab1ce061a1b54b69431fc3359) Thanks [@kianbazza](https://github.com/kianbazza)! - Forward the `data-highlighted` attribute to `Select.ItemIndicator` so it reflects its parent item's highlighted state, matching `Select.Item`.

- [#330](https://github.com/bazzalabs/ui/pull/330) [`7975ad0`](https://github.com/bazzalabs/ui/commit/7975ad0ec1399ac515a0e48004a1dc60a996bc59) Thanks [@kianbazza](https://github.com/kianbazza)! - Extend the `items` prop on `Select.Root` and `Combobox.Root`. The array form now accepts `keywords` (extra filter terms merged into an item's search keywords) and a `null` value, e.g. `{ value: null, label: 'Select…' }`. Item keyword auto-population reads `items[].keywords`, so you no longer need a separate per-`Item` `keywords` prop when you already describe items via `items`.

- [#307](https://github.com/bazzalabs/ui/pull/307) [`1ae5d57`](https://github.com/bazzalabs/ui/commit/1ae5d579b14f7c2b89e4cbfec2f5d5b2528f0dd6) Thanks [@kianbazza](https://github.com/kianbazza)! - Unify the data-first popup menu API: `Surface`/`List`/`Input` now accept the data-first props directly and `Popup` auto-renders data subpages. Removes `DataSurface`, `DataList`, `DataInput`, and `DataSubpages`. This is a breaking change.

## 0.1.0-canary.6

### Patch Changes

- [#301](https://github.com/bazzalabs/ui/pull/301) [`f09158a`](https://github.com/bazzalabs/ui/commit/f09158a894304be01956230b4384f972f8b34b70) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix video player buttons so composed button props no longer override internal button actions.

## 0.1.0-canary.5

### Patch Changes

- [#296](https://github.com/bazzalabs/ui/pull/296) [`be5a86f`](https://github.com/bazzalabs/ui/commit/be5a86f670fd50373f7491bc28a3ff99489b58d8) Thanks [@kianbazza](https://github.com/kianbazza)! - Compose video player component part event handlers so consumers can opt out of internal behavior with preventBaseUIHandler.

- [#294](https://github.com/bazzalabs/ui/pull/294) [`e969522`](https://github.com/bazzalabs/ui/commit/e9695221417b4dcabc1ffb09aa98a231df9d64ed) Thanks [@kianbazza](https://github.com/kianbazza)! - Compose video player root event handlers so consumer handlers run before internal behavior and can opt out with preventBaseUIHandler.

- [#295](https://github.com/bazzalabs/ui/pull/295) [`4a3c314`](https://github.com/bazzalabs/ui/commit/4a3c314ecba1df594baf2b5a6d1a889a3a724be9) Thanks [@kianbazza](https://github.com/kianbazza)! - Reset the video player idle timeout when focus enters the player or Tab navigation occurs inside it.

- [#297](https://github.com/bazzalabs/ui/pull/297) [`0e6afd8`](https://github.com/bazzalabs/ui/commit/0e6afd84ee4032a741fa727fb43d544dcd85ec35) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `autoPlay` support to the video player

## 0.1.0-canary.4

### Patch Changes

- [#291](https://github.com/bazzalabs/ui/pull/291) [`7838848`](https://github.com/bazzalabs/ui/commit/783884895643a1675cdb4cecfe9715d82e556911) Thanks [@kianbazza](https://github.com/kianbazza)! - Improve seek interactions so playback pauses while scrubbing and resumes afterward when appropriate, including pointer and keyboard-driven seeking.

- [#292](https://github.com/bazzalabs/ui/pull/292) [`51b3b02`](https://github.com/bazzalabs/ui/commit/51b3b0285b833387fa0e16791704506544f5e422) Thanks [@kianbazza](https://github.com/kianbazza)! - Fixes an issue where pressing the Space key does not toggle playback if the focused element is a range input, such as the seek slider

## 0.1.0-canary.3

### Minor Changes

- [#289](https://github.com/bazzalabs/ui/pull/289) [`8120e94`](https://github.com/bazzalabs/ui/commit/8120e9414bca93c49d703a1133a5defa86843944) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `VideoPlayer` primitive component.

## 0.1.0-canary.2

### Patch Changes

- [#283](https://github.com/bazzalabs/ui/pull/283) [`d0c975d`](https://github.com/bazzalabs/ui/commit/d0c975de8f6effad9283322992e92460e039d8c2) Thanks [@kianbazza](https://github.com/kianbazza)! - Bumping...

## 0.1.0-canary.1

### Patch Changes

- [#282](https://github.com/bazzalabs/ui/pull/282) [`9c8bfbd`](https://github.com/bazzalabs/ui/commit/9c8bfbd5b2224872b33a115d15de6186cf2dbad3) Thanks [@kianbazza](https://github.com/kianbazza)! - Add a placeholder changeset to trigger the canary release PR.
