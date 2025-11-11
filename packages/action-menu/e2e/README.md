# E2E Tests for Action Menu

This directory contains end-to-end tests for the action-menu package using Playwright.

## Running Tests

```bash
# Run all E2E tests (headless)
bun run test:e2e

# Run with UI mode (interactive)
bun run test:e2e:ui

# Run with debug mode (step through tests)
bun run test:e2e:debug

# Run with headed browsers (see the browser)
bun run test:e2e:headed
```

## Test Organization

- `basic-interactions.spec.ts` - Basic menu open/close, clicking, focus
- `keyboard-navigation.spec.ts` - Keyboard navigation (arrows, Enter, Escape, Vim)
- `search-and-filter.spec.ts` - Search input filtering and results
- `async-loading.spec.ts` - Async data loading, deep search
- `submenu-navigation.spec.ts` - Submenu hover, keyboard, aim-guard
- `fixtures/` - Shared test components and menu definitions

## Browser Coverage

Tests run against:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Writing Tests

1. Import test fixtures from `./fixtures/test-menu`
2. Use Playwright's component testing for isolated component tests
3. Use standard Playwright tests for full integration tests
4. Keep tests focused on user-visible behavior
