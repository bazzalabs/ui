import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import type {
  ItemDef,
  NodeDef,
  QueryLoaderConfig,
} from '../internal/popup-menu/index.js'
import { createVanillaQueryLoader } from '../loaders/vanilla.js'
import { SuggestionMenu } from './index.js'
import { countShownRows } from './surface/results-reporter.js'

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string, label = value): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-testid={value}>
      {label}
    </SuggestionMenu.Item>
  ),
})

type HostKind = 'input' | 'textarea' | 'contenteditable'

function setup(
  options: {
    host?: HostKind
    hostProps?: Record<string, string>
    content?: ItemDef[]
    asyncContent?: QueryLoaderConfig
    getAriaResultsText?: SuggestionMenu.Root.Props['getAriaResultsText']
    surfaceProps?: Partial<SuggestionMenu.Surface.Props>
  } = {},
) {
  const menu = SuggestionMenu.createHandle()
  const hostRef = (el: HTMLElement | null) => {
    if (el) menu.attach(el)
  }
  const onKeyDown = (event: React.KeyboardEvent) => {
    menu.handleKeyDown(event)
  }
  const hostProps = { 'data-testid': 'host', ...options.hostProps }
  const kind = options.host ?? 'textarea'
  const host =
    kind === 'input' ? (
      <input ref={hostRef} onKeyDown={onKeyDown} {...hostProps} />
    ) : kind === 'textarea' ? (
      <textarea ref={hostRef} onKeyDown={onKeyDown} {...hostProps} />
    ) : (
      // biome-ignore lint/a11y/noStaticElementInteractions: an editor host
      <div
        ref={hostRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={onKeyDown}
        {...hostProps}
      />
    )
  render(
    <>
      {host}
      <SuggestionMenu.Root
        handle={menu}
        getAriaResultsText={options.getAriaResultsText}
      >
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface
                content={
                  options.content ?? [
                    item('Alice', 'Alice Smith'),
                    item('Bob'),
                    item('Carol'),
                  ]
                }
                asyncContent={options.asyncContent}
                {...options.surfaceProps}
              >
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>,
  )
  const hostEl = screen.getByTestId('host')
  const press = (key: string) =>
    act(() => {
      fireEvent.keyDown(hostEl, { key })
    })
  return { menu, host: hostEl, press }
}

async function open(
  menu: ReturnType<typeof SuggestionMenu.createHandle>,
  query = '',
) {
  act(() => menu.update({ query }))
  await screen.findByTestId('popup')
  await waitFor(() =>
    expect(document.querySelector('[data-highlighted]')).not.toBeNull(),
  )
}

// The Root's region comes first; the Surface renders its own selection status.
const status = () =>
  (
    screen.getAllByRole('status', { hidden: true })[0]?.textContent ?? ''
  ).replaceAll('\u2060', '')

describe('SuggestionMenu host attributes', () => {
  it('makes an <input> a combobox only while open', async () => {
    const { menu, host } = setup({ host: 'input' })
    expect(host).not.toHaveAttribute('role')
    expect(host).not.toHaveAttribute('aria-expanded')

    await open(menu)

    const listbox = screen.getByRole('listbox')
    expect(host).toHaveAttribute('role', 'combobox')
    expect(host).toHaveAttribute('aria-expanded', 'true')
    expect(host).toHaveAttribute('aria-autocomplete', 'list')
    expect(host).toHaveAttribute('aria-haspopup', 'listbox')
    await waitFor(() =>
      expect(host).toHaveAttribute('aria-controls', listbox.id),
    )
    expect(listbox.id).not.toBe('')

    act(() => menu.close())

    await waitFor(() => expect(host).not.toHaveAttribute('role'))
    for (const name of [
      'aria-expanded',
      'aria-controls',
      'aria-autocomplete',
      'aria-haspopup',
      'aria-activedescendant',
    ]) {
      expect(host).not.toHaveAttribute(name)
    }
  })

  it.each([
    'textarea',
    'contenteditable',
  ] as const)('keeps a %s a textbox, without aria-expanded', async (kind) => {
    const { menu, host } = setup({ host: kind })
    await open(menu)

    expect(host).not.toHaveAttribute('role')
    expect(host).not.toHaveAttribute('aria-expanded')
    expect(host).toHaveAttribute('aria-autocomplete', 'list')
    expect(host).toHaveAttribute('aria-haspopup', 'listbox')
    await waitFor(() =>
      expect(host).toHaveAttribute(
        'aria-controls',
        screen.getByRole('listbox').id,
      ),
    )
  })

  it("saves the host's own values before the kept-mounted list writes", async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <input
          data-testid="host"
          ref={(el) => {
            if (el) menu.attach(el)
          }}
        />
        <SuggestionMenu.Root handle={menu}>
          {/* Re-rendered with the Root; a new ref re-attaches the list's. */}
          {() => (
            <SuggestionMenu.Portal keepMounted>
              <SuggestionMenu.Positioner>
                <SuggestionMenu.Popup>
                  <SuggestionMenu.Surface content={[item('Alice')]}>
                    <SuggestionMenu.List ref={(el) => void el}>
                      <Rows />
                    </SuggestionMenu.List>
                  </SuggestionMenu.Surface>
                </SuggestionMenu.Popup>
              </SuggestionMenu.Positioner>
            </SuggestionMenu.Portal>
          )}
        </SuggestionMenu.Root>
      </>,
    )
    const host = screen.getByTestId('host')
    for (let round = 0; round < 2; round++) {
      act(() => menu.update({ query: '' }))
      await waitFor(() => expect(host).toHaveAttribute('aria-controls'))
      act(() => menu.close())
      await waitFor(() => expect(host).not.toHaveAttribute('role'))
    }

    expect(host).not.toHaveAttribute('aria-expanded')
    expect(host).not.toHaveAttribute('aria-controls')
  })

  it("puts back the host's own attributes when it closes", async () => {
    const { menu, host } = setup({
      host: 'input',
      hostProps: { role: 'searchbox', 'aria-controls': 'results' },
    })
    await open(menu)
    expect(host).toHaveAttribute('role', 'combobox')

    act(() => menu.close())

    await waitFor(() => expect(host).toHaveAttribute('role', 'searchbox'))
    expect(host).toHaveAttribute('aria-controls', 'results')
    expect(host).not.toHaveAttribute('aria-autocomplete')
  })
})

describe('SuggestionMenu host attributes on editors', () => {
  it("keeps an editor's own textbox role", async () => {
    const { menu, host } = setup({
      host: 'contenteditable',
      hostProps: { role: 'textbox', 'aria-multiline': 'true' },
    })
    await open(menu)
    await waitFor(() => expect(host).toHaveAttribute('aria-controls'))

    expect(host).toHaveAttribute('role', 'textbox')
    act(() => menu.close())
    await waitFor(() => expect(host).not.toHaveAttribute('aria-controls'))
    expect(host).toHaveAttribute('role', 'textbox')
  })

  it('points aria-controls at the list as soon as it mounts', async () => {
    const loader = createVanillaQueryLoader({
      fetcher: () => new Promise<NodeDef[]>(() => {}),
      minQueryLength: 0,
    })
    const { menu, host } = setup({
      content: [],
      asyncContent: loader,
      surfaceProps: { asyncContentReveal: 'block' },
    })
    act(() => menu.update({ query: '' }))
    const listbox = await screen.findByRole('listbox')

    expect(host).toHaveAttribute('aria-controls', listbox.id)
  })
})

describe('SuggestionMenu aria-activedescendant', () => {
  it('stays off when the query comes back to the one it was armed for', async () => {
    const { menu, host, press } = setup()
    await open(menu)
    press('ArrowDown')
    press('ArrowUp')
    expect(host).toHaveAttribute('aria-activedescendant')

    act(() => menu.update({ query: 'a' }))
    await waitFor(() =>
      expect(host).not.toHaveAttribute('aria-activedescendant'),
    )
    act(() => menu.update({ query: '' }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(host).not.toHaveAttribute('aria-activedescendant')
  })

  it('never points at a row the pointer highlights, even briefly', async () => {
    const user = userEvent.setup()
    const { menu, host, press } = setup()
    await open(menu)
    press('ArrowDown')
    const carol = screen.getByTestId('Carol').id
    // Every value the attribute held, including ones replaced before the
    // observer's callback ran.
    const seen: Array<string | null> = []
    const observer = new MutationObserver((records) => {
      for (const record of records) seen.push(record.oldValue)
      seen.push(host.getAttribute('aria-activedescendant'))
    })
    observer.observe(host, {
      attributeFilter: ['aria-activedescendant'],
      attributeOldValue: true,
    })

    await new Promise((resolve) => setTimeout(resolve, 150))
    await user.hover(screen.getByTestId('Carol'))
    await waitFor(() =>
      expect(screen.getByTestId('Carol')).toHaveAttribute('data-highlighted'),
    )
    observer.disconnect()

    expect(seen).not.toContain(carol)
  })

  it('follows the highlight only after the keyboard moves it', async () => {
    const { menu, host, press } = setup()
    await open(menu)
    expect(screen.getByTestId('Alice')).toHaveAttribute('data-highlighted')
    expect(host).not.toHaveAttribute('aria-activedescendant')

    press('ArrowDown')
    expect(host).toHaveAttribute(
      'aria-activedescendant',
      screen.getByTestId('Bob').id,
    )

    press('Home')
    expect(host).toHaveAttribute(
      'aria-activedescendant',
      screen.getByTestId('Alice').id,
    )
  })

  it('clears when the query changes, even if the highlighted row stays', async () => {
    const { menu, host, press } = setup()
    await open(menu)
    press('ArrowDown')
    expect(host).toHaveAttribute('aria-activedescendant')

    act(() => menu.update({ query: 'b' }))

    await waitFor(() =>
      expect(host).not.toHaveAttribute('aria-activedescendant'),
    )
    expect(screen.getByTestId('Bob')).toHaveAttribute('data-highlighted')
  })

  it('clears on ←/→', async () => {
    const { menu, host, press } = setup()
    await open(menu)
    press('ArrowDown')
    expect(host).toHaveAttribute('aria-activedescendant')

    press('ArrowLeft')

    expect(host).not.toHaveAttribute('aria-activedescendant')
    expect(screen.getByTestId('Bob')).toHaveAttribute('data-highlighted')
  })

  it('clears when the pointer moves the highlight', async () => {
    const user = userEvent.setup()
    const { menu, host, press } = setup()
    await open(menu)
    press('ArrowDown')
    expect(host).toHaveAttribute('aria-activedescendant')

    // The menu ignores pointer moves right after it opens.
    await new Promise((resolve) => setTimeout(resolve, 150))
    await user.hover(screen.getByTestId('Carol'))

    await waitFor(() =>
      expect(screen.getByTestId('Carol')).toHaveAttribute('data-highlighted'),
    )
    expect(host).not.toHaveAttribute('aria-activedescendant')
  })
})

describe('SuggestionMenu result summary', () => {
  it('has an empty status region before the menu opens', () => {
    setup()
    expect(status()).toBe('')
  })

  it('announces the count and the row Enter would choose', async () => {
    const { menu } = setup()
    await open(menu)
    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))

    act(() => menu.update({ query: 'bo' }))
    await waitFor(() => expect(status()).toBe('1 result, first: Bob'))

    act(() => menu.update({ query: 'zzz' }))
    await waitFor(() => expect(status()).toBe('No results'))
  })

  it('announces each settled summary once', async () => {
    const { menu } = setup()
    const region = screen.getAllByRole('status', { hidden: true })[0]
    const texts: string[] = []
    const observer = new MutationObserver(() => {
      const text = (region?.textContent ?? '').replaceAll('\u2060', '')
      if (text) texts.push(text)
    })
    if (region) {
      observer.observe(region, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    }

    await open(menu)
    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    observer.disconnect()

    expect(texts).toEqual(['3 results, first: Alice Smith'])
  })

  it('says nothing when the highlight moves', async () => {
    const user = userEvent.setup()
    const { menu, press } = setup()
    await open(menu)
    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))
    const region = screen.getAllByRole('status', { hidden: true })[0]
    const before = region?.textContent

    const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

    // The raw text, marker included: any re-announcement would change it.
    press('ArrowDown')
    await settle()
    expect(region?.textContent).toBe(before)
    press('End')
    await settle()
    expect(region?.textContent).toBe(before)
    // The menu ignores pointer moves right after it opens.
    await new Promise((resolve) => setTimeout(resolve, 150))
    await user.hover(screen.getByTestId('Bob'))
    await settle()
    expect(screen.getByTestId('Bob')).toHaveAttribute('data-highlighted')
    expect(region?.textContent).toBe(before)
  })

  it('counts disabled rows, which are still results', async () => {
    const disabled: ItemDef = { ...item('Bob'), disabled: true }
    const { menu } = setup({
      content: [item('Alice', 'Alice Smith'), disabled, item('Carol')],
    })
    await open(menu)

    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))
  })

  it('counts a virtualized list by its items, like Empty', () => {
    // Pre-registered virtual rows stay registered after the items empty out.
    const store = {
      state: { virtualized: true, virtualItemsCount: 0, filteredCount: 4 },
    } as unknown as Parameters<typeof countShownRows>[0]

    expect(countShownRows(store)).toBe(0)
  })

  it("doesn't say 'No results' when every row is disabled", async () => {
    const { menu } = setup({
      content: [
        { ...item('Alice'), disabled: true },
        { ...item('Bob'), disabled: true },
      ],
    })
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('Bob')

    await waitFor(() => expect(status()).toMatch(/^2 results/))
  })

  it('reads the row from its own list, not a page element with its id', async () => {
    const { menu } = setup()
    await open(menu)
    const id = screen.getByTestId('Alice').id
    act(() => menu.close())
    await waitFor(() => expect(screen.queryByTestId('popup')).toBeNull())
    const impostor = document.createElement('h2')
    impostor.id = id
    impostor.textContent = 'Page heading'
    document.body.prepend(impostor)

    await open(menu)

    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))
    impostor.remove()
  })

  it('uses getAriaResultsText', async () => {
    const { menu } = setup({
      getAriaResultsText: (count, label) => `${count} résultats (${label})`,
    })
    await open(menu)
    await waitFor(() => expect(status()).toBe('3 résultats (Alice Smith)'))
  })

  it('waits for the loaders to settle', async () => {
    const pending = new Map<string, (rows: NodeDef[]) => void>()
    const loader = createVanillaQueryLoader({
      fetcher: (query: string) =>
        new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
      minQueryLength: 0,
    })
    const { menu } = setup({ content: [item('Alice')], asyncContent: loader })
    await open(menu)
    await screen.findByTestId('Alice')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(status()).toBe('')

    await act(async () => {
      pending.get('')?.([item('Dana'), item('Eve')])
    })

    await waitFor(() => expect(status()).toBe('3 results, first: Alice'))
  })

  it('announces again after reopening', async () => {
    const { menu } = setup()
    await open(menu)
    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))

    act(() => menu.close())
    await waitFor(() => expect(status()).toBe(''))
    await open(menu)

    await waitFor(() => expect(status()).toBe('3 results, first: Alice Smith'))
  })
})
