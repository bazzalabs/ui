# Action Menu Testing Guide

Comprehensive testing setup for the `@bazza-ui/action-menu` package, including unit tests and E2E tests.

## 📊 Test Coverage Summary

### Unit Tests: **192 tests** ✅

- `dom-utils.test.ts` - 18 tests
- `command-score.test.ts` - 48 tests (fuzzy search)
- `keyboard.test.ts` - 49 tests (keyboard navigation)
- `aim-guard.test.ts` - 27 tests (mouse aim prediction)
- `menu-utils.test.ts` - 28 tests (menu instantiation)
- `deep-search-utils.test.ts` - 22 tests (deep search)

### E2E Tests: **5 test suites** ✅

- `basic-interactions.spec.tsx` - Menu open/close, selection, focus
- `keyboard-navigation.spec.tsx` - Full keyboard navigation flows
- `search-and-filter.spec.tsx` - Search input and filtering
- `submenu-navigation.spec.tsx` - Submenu interactions and nesting
- `hide-search-until-active.spec.tsx` - hideSearchUntilActive feature behavior

## 🧪 Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
bun run test

# Run in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

### E2E Tests (Playwright)

**⚠️ Note**: E2E tests are currently not fully operational. There's an environment setup issue with `@playwright/experimental-ct-react` component mounting. The tests are written and fixtures are correct, but components aren't rendering in the test environment. This requires further investigation into the Playwright component testing setup.

```bash
# Run all E2E tests (headless)
bun run test:e2e

# Run with UI mode (interactive)
bun run test:e2e:ui

# Run with debug mode (step through)
bun run test:e2e:debug

# Run with headed browsers (see the browser)
bun run test:e2e:headed
```

### All Tests

```bash
# Run unit tests + type check
bun run test && bun run type-check
```

## 📁 Test File Organization

```
packages/action-menu/
├── src/
│   └── __tests__/
│       └── lib/
│           ├── dom-utils.test.ts
│           ├── command-score.test.ts
│           ├── keyboard.test.ts
│           ├── aim-guard.test.ts
│           ├── menu-utils.test.ts
│           └── deep-search-utils.test.ts
├── e2e/
│   ├── basic-interactions.spec.tsx
│   ├── keyboard-navigation.spec.tsx
│   ├── search-and-filter.spec.tsx
│   ├── submenu-navigation.spec.tsx
│   ├── hide-search-until-active.spec.tsx
│   ├── test-app.tsx (test component)
│   ├── fixtures/
│   │   └── test-menu.tsx (test data)
│   └── README.md
└── playwright/
    ├── index.html
    └── index.tsx
```

## 🎯 What's Tested

### Core Utilities (Unit Tests)

#### `command-score.test.ts`
- Exact matches & case sensitivity
- Word boundary jumps (spaces, slashes, hyphens)
- Fuzzy matching & character skipping
- Transpositions
- Alias matching
- Special characters
- Real-world scenarios (file paths, camelCase)

#### `keyboard.test.ts`
- Arrow keys (Up/Down/Left/Right)
- Home/End/PageUp/PageDown
- Submenu open/close keys (direction-aware)
- Vim bindings (Ctrl+j/k/h/l/n/p)
- LTR/RTL support
- Direction resolution

#### `aim-guard.test.ts`
- Anchor side resolution (left/right)
- Mouse trail smoothing
- Trajectory prediction (willHitSubmenu)
- Hit detection geometry
- Integration scenarios

#### `menu-utils.test.ts`
- Node instantiation (items, groups, submenus)
- Radio groups & checkbox handling
- Menu instantiation from definitions
- Shallow & deep flattening
- Nested structures

#### `deep-search-utils.test.ts`
- Deep search loader collection
- Nested submenu traversal
- deepSearch flag handling
- Loader result aggregation
- Breadcrumb generation
- Result injection into menu tree

#### `dom-utils.test.ts`
- Point-in-bounds hit testing
- Boundary conditions
- Edge cases (zero-width, floating points)

### User Flows (E2E Tests)

#### `basic-interactions.spec.tsx`
- Opening menu with click
- Closing menu (outside click, Escape)
- Displaying all menu items
- Selecting items
- Disabled item handling
- Focus management
- Checkbox interactions
- Multiple open/close cycles

#### `keyboard-navigation.spec.tsx`
- Navigation with Arrow keys
- Jump with Home/End
- Selection with Enter
- Closing with Escape
- Skipping disabled items
- Wrapping (first ↔ last)
- Tab key prevention
- Submenu navigation (ArrowRight/Left)
- Vim bindings (Ctrl+j/k/h/l)
- PageUp/PageDown
- Rapid key presses

#### `search-and-filter.spec.tsx`
- Filtering items by search query
- Keyword matching
- Fuzzy matching
- Empty state display
- Case insensitivity
- Real-time updates as typing
- Large list performance
- Keyboard navigation in filtered results
- Search clearing (Escape)
- Special characters handling

#### `submenu-navigation.spec.tsx`
- Opening submenus (hover, keyboard, Enter)
- Closing submenus (ArrowLeft, Escape)
- Nested submenu navigation
- Multiple levels (3+ deep)
- Focus management across levels
- Mouse hover on nested menus
- Selecting items in submenus
- Clicking submenu items
- Navigating back through levels
- Rapid open/close cycles

#### `hide-search-until-active.spec.tsx`
- Input hidden by default with `hideSearchUntilActive: true`
- Input visible without the flag
- Keyboard navigation does NOT trigger input visibility
- Typing makes input visible
- Input stays visible after clearing query
- Input resets (hides) on menu close/reopen
- Behavior in submenus
- Selecting items without visible input
- Filtering results when input becomes visible
- Multiple open/close cycles

## 🛠️ Test Infrastructure

### Vitest (Unit Tests)
- **Environment**: jsdom
- **Features**:
  - TypeScript support
  - JSX/TSX support
  - Code coverage (via c8)
  - Fast execution
  - Watch mode

### Playwright (E2E Tests)
- **Mode**: Component testing
- **Browsers**: Chromium (Desktop Chrome)
- **Features**:
  - Real browser testing
  - Screenshot on failure
  - Trace on retry
  - Component isolation
  - Fast feedback

## 📝 Writing New Tests

### Adding Unit Tests

1. Create test file in `src/__tests__/lib/`
2. Name it `*.test.ts`
3. Import from source with `.js` extension:

```typescript
import { myFunction } from '../../lib/my-module.js'
import type { MyType } from '../../types.js'
```

4. Use Vitest's `describe`, `it`, `expect`:

```typescript
import { describe, it, expect } from 'vitest'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expected)
  })
})
```

### Adding E2E Tests

1. Create test file in `e2e/`
2. Name it `*.spec.tsx`
3. Import from Playwright component testing:

```typescript
import { test, expect } from '@playwright/experimental-ct-react'
import { ControlledTestApp } from './test-app.js'

test.describe('Feature Name', () => {
  test('should do something', async ({ mount }) => {
    const component = await mount(<ControlledTestApp menuDef={menuDef} />)

    await component.getByTestId('element').click()
    await expect(component.getByTestId('result')).toBeVisible()
  })
})
```

## 🎨 Test Patterns

### Unit Test Patterns

**Testing pure functions:**
```typescript
it('should calculate correctly', () => {
  expect(add(2, 3)).toBe(5)
})
```

**Testing with edge cases:**
```typescript
describe('edge cases', () => {
  it('should handle empty input', () => {
    expect(process([])).toEqual([])
  })

  it('should handle null', () => {
    expect(process(null)).toBe(null)
  })
})
```

**Testing complex scenarios:**
```typescript
it('should handle complete workflow', () => {
  const result1 = step1(input)
  const result2 = step2(result1)
  const final = step3(result2)

  expect(final).toMatchObject({ /* ... */ })
})
```

### E2E Test Patterns

**Testing user interactions:**
```typescript
test('user can select item', async ({ mount }) => {
  const component = await mount(<TestApp />)

  await component.getByTestId('trigger').click()
  await component.getByTestId('item-1').click()

  await expect(component.getByTestId('selected')).toHaveText('item-1')
})
```

**Testing keyboard navigation:**
```typescript
test('keyboard navigation works', async ({ mount, page }) => {
  const component = await mount(<TestApp />)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await expect(component.getByTestId('result')).toBeVisible()
})
```

**Testing with timeouts (for hover, debounce):**
```typescript
test('hover opens submenu', async ({ mount, page }) => {
  const component = await mount(<TestApp />)

  await component.getByTestId('trigger').hover()
  await page.waitForTimeout(200)

  await expect(component.getByTestId('submenu')).toBeVisible()
})
```

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run specific test file
bun run test dom-utils

# Run tests matching pattern
bun run test "keyboard"

# Run with verbose output
bun run test --reporter=verbose

# Run single test (add .only)
it.only('should test this one', () => { /* ... */ })
```

### E2E Tests

```bash
# Run with UI (best for debugging)
bun run test:e2e:ui

# Run with headed browser
bun run test:e2e:headed

# Run with debug mode
bun run test:e2e:debug

# Run specific test file
bun run test:e2e basic-interactions

# Run single test (add .only)
test.only('should do something', async ({ mount }) => { /* ... */ })
```

## 📊 Coverage Goals

- **Unit Tests**: Focus on critical business logic
  - ✅ Search/scoring algorithms
  - ✅ Keyboard navigation
  - ✅ Menu instantiation
  - ✅ Deep search orchestration
  - ⚠️ TODO: Async hooks (use-loader)
  - ⚠️ TODO: Store management (surface-store)

- **E2E Tests**: Focus on user workflows
  - ✅ Basic interactions
  - ✅ Keyboard navigation
  - ✅ Search & filter
  - ✅ Submenu navigation
  - ⚠️ TODO: Async loading (with real loaders)
  - ⚠️ TODO: Responsive (drawer vs dropdown)

## 🚀 CI Integration

The tests are ready for CI integration. Add to your GitHub Actions workflow:

```yaml
- name: Run tests
  run: |
    bun install
    bun run test
    bun run type-check

- name: Run E2E tests
  run: |
    bun run test:e2e
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Component Testing](https://playwright.dev/docs/test-components)
- [Testing Library](https://testing-library.com/)

## ✅ Test Checklist

When adding new features, ensure:

- [ ] Unit tests for new utilities/logic
- [ ] E2E tests for new user interactions
- [ ] Edge cases covered
- [ ] Type checking passes
- [ ] All tests pass locally
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test names are descriptive
- [ ] Tests are isolated (no dependencies between tests)
