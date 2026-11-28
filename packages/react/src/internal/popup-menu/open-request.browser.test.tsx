import { createMenuTreeResolver, currentTask } from '@bazza-ui/menu-core'
import { afterEach, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { MenuTreeStore } from './store/MenuTreeStore.js'

// A real key reaches each native listener in a task of its own (the
// browser runs microtasks between listener callbacks), as Base UI's
// dismissal on the document and React's root listener do. Two that ask a
// menu for the same change with the key's event are one request: the
// consumer hears it once.

const cleanups: Array<() => void> = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
})

function listen(target: EventTarget, listener: (event: Event) => void) {
  target.addEventListener('keydown', listener)
  cleanups.push(() => target.removeEventListener('keydown', listener))
}

it('tells the consumer once of a change two listeners of one key ask for', async () => {
  const onOpenChange = vi.fn()
  const tree = new MenuTreeStore({
    resolver: createMenuTreeResolver(),
    onOpenChange,
  })
  tree.createRootStore()
  // A controlled root that hasn't applied the close: a second ask isn't a
  // `noop` by its value
  tree.control(true)
  const input = document.createElement('input')
  document.body.append(input)
  cleanups.push(() => input.remove())

  const tasks: object[] = []
  const ask = (event: Event) => {
    tasks.push(currentTask())
    tree.requestOpen(false, 'escape-key', event)
  }
  listen(input, ask)
  listen(document, ask)
  input.focus()

  await userEvent.keyboard('{Escape}')

  // Each listener ran in a task of its own
  expect(tasks).toHaveLength(2)
  expect(tasks[0]).not.toBe(tasks[1])
  expect(onOpenChange).toHaveBeenCalledTimes(1)
  expect(onOpenChange).toHaveBeenCalledWith(
    false,
    expect.objectContaining({ reason: 'escape-key' }),
  )
})
