import { describe, expect, it } from 'vitest'
import { ElementRegistry } from './element-registry.js'

// A stand-in for DOM nodes: `contains` walks up the parent links, as
// `Node.contains` does, and holds for the node itself.
class FakeNode {
  constructor(readonly parent: FakeNode | null = null) {}

  contains(other: FakeNode | null): boolean {
    for (let node = other; node; node = node.parent) {
      if (node === this) return true
    }
    return false
  }
}

function tree() {
  const body = new FakeNode()
  const trigger = new FakeNode(body)
  // Portals put each popup straight under the body, beside the trigger.
  const popup = new FakeNode(body)
  const item = new FakeNode(popup)
  const submenuPopup = new FakeNode(body)
  const submenuItem = new FakeNode(submenuPopup)
  const unrelated = new FakeNode(body)
  const unrelatedChild = new FakeNode(unrelated)
  return {
    body,
    trigger,
    popup,
    item,
    submenuPopup,
    submenuItem,
    unrelated,
    unrelatedChild,
  }
}

describe('ElementRegistry.owns', () => {
  it('owns nodes inside every registered element, portaled popups included', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('trigger', nodes.trigger)
    registry.add('popup', nodes.popup, 'root')
    registry.add('popup', nodes.submenuPopup, 'sub')

    expect(registry.owns(nodes.trigger)).toBe(true)
    expect(registry.owns(nodes.item)).toBe(true)
    expect(registry.owns(nodes.submenuItem)).toBe(true)
  })

  it("doesn't own nodes outside the registered elements, or their ancestors", () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('popup', nodes.popup, 'root')

    expect(registry.owns(nodes.unrelatedChild)).toBe(false)
    expect(registry.owns(nodes.body)).toBe(false)
    expect(registry.owns(null)).toBe(false)
  })

  it('stops owning an element once it is removed', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('popup', nodes.popup, 'root')
    const remove = registry.add('popup', nodes.submenuPopup, 'sub')

    remove()

    expect(registry.owns(nodes.submenuItem)).toBe(false)
    expect(registry.owns(nodes.item)).toBe(true)
  })

  it('keeps exempt elements apart from the ones it owns', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.getExempt = () => [null, nodes.unrelated]

    expect(registry.isExempt(nodes.unrelatedChild)).toBe(true)
    expect(registry.owns(nodes.unrelatedChild)).toBe(false)
    expect(registry.isExempt(nodes.item)).toBe(false)
  })

  it('reads the exempt elements on each check', () => {
    const nodes = tree()
    let exempt: FakeNode[] = []
    const registry = new ElementRegistry<FakeNode>()

    expect(registry.isExempt(nodes.unrelated)).toBe(false)
    registry.getExempt = () => exempt
    expect(registry.isExempt(nodes.unrelated)).toBe(false)
    exempt = [nodes.unrelated]
    expect(registry.isExempt(nodes.unrelated)).toBe(true)
  })
})

describe('ElementRegistry.inBackdrop', () => {
  it('tells a backdrop the tree registered from its other elements', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('popup', nodes.popup, 'root')
    registry.add('backdrop', nodes.unrelated)

    expect(registry.inBackdrop(nodes.unrelatedChild)).toBe(true)
    expect(registry.owns(nodes.unrelatedChild)).toBe(true)
    expect(registry.inBackdrop(nodes.item)).toBe(false)
    expect(registry.inBackdrop(null)).toBe(false)
  })
})

describe('ElementRegistry.nest', () => {
  it('owns what nested registries own, at any depth, until unlinked', () => {
    const nodes = tree()
    const outer = new ElementRegistry<FakeNode>()
    const middle = new ElementRegistry<FakeNode>()
    const inner = new ElementRegistry<FakeNode>()
    outer.add('popup', nodes.popup, 'outer')
    inner.add('popup', nodes.unrelated, 'inner')
    const unlinkMiddle = outer.nest(middle)
    middle.nest(inner)

    expect(outer.owns(nodes.unrelatedChild)).toBe(true)
    // A nested tree's popups don't answer this tree's surface lookups.
    expect(outer.surfaceFor(nodes.unrelatedChild)).toBeNull()

    unlinkMiddle()
    expect(outer.owns(nodes.unrelatedChild)).toBe(false)
    expect(middle.owns(nodes.unrelatedChild)).toBe(true)
  })
})

describe('ElementRegistry.claim', () => {
  it('remembers the events its parts claimed', () => {
    const registry = new ElementRegistry<FakeNode>()
    const claimed = {}
    registry.claim(claimed)

    expect(registry.claimed(claimed)).toBe(true)
    expect(registry.claimed({})).toBe(false)
  })

  it('reports what nested registries claimed, at any depth, until unlinked', () => {
    const outer = new ElementRegistry<FakeNode>()
    const middle = new ElementRegistry<FakeNode>()
    const inner = new ElementRegistry<FakeNode>()
    const unlinkMiddle = outer.nest(middle)
    middle.nest(inner)
    const event = {}
    inner.claim(event)

    expect(outer.claimed(event)).toBe(true)
    unlinkMiddle()
    expect(outer.claimed(event)).toBe(false)
  })
})

describe('ElementRegistry.popupFor', () => {
  it("finds a nested tree's popups too, the innermost first", () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('popup', nodes.popup, 'root')
    const nested = new ElementRegistry<FakeNode>()
    // A nested tree's popup, portaled beside the outer one
    nested.add('popup', nodes.unrelated, 'nested')
    const unnest = registry.nest(nested)

    expect(registry.popupFor(nodes.unrelatedChild)).toBe(nodes.unrelated)
    expect(registry.popupFor(nodes.item)).toBe(nodes.popup)
    // Its surface ids stay its own
    expect(registry.surfaceFor(nodes.unrelatedChild)).toBe(null)

    unnest()
    expect(registry.popupFor(nodes.unrelatedChild)).toBe(null)
  })

  it('picks the nested popup when it renders inside an outer one', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('popup', nodes.popup, 'root')
    const nested = new ElementRegistry<FakeNode>()
    const inner = new FakeNode(nodes.item)
    nested.add('popup', inner, 'nested')
    registry.nest(nested)

    expect(registry.popupFor(new FakeNode(inner))).toBe(inner)
  })
})

describe('ElementRegistry.surfaceFor', () => {
  it('names the surface of the popup holding the node', () => {
    const nodes = tree()
    const registry = new ElementRegistry<FakeNode>()
    registry.add('positioner', nodes.body)
    registry.add('popup', nodes.popup, 'root')
    registry.add('popup', nodes.submenuPopup, 'sub')

    expect(registry.surfaceFor(nodes.item)).toBe('root')
    expect(registry.surfaceFor(nodes.submenuItem)).toBe('sub')
    expect(registry.popupFor(nodes.submenuItem)).toBe(nodes.submenuPopup)
    expect(registry.surfaceFor(nodes.trigger)).toBeNull()
    expect(registry.popupFor(nodes.unrelated)).toBeNull()
  })

  it('picks the innermost popup when one renders inside another, whatever the registration order', () => {
    const outer = new FakeNode()
    const inner = new FakeNode(outer)
    const node = new FakeNode(inner)

    const innerFirst = new ElementRegistry<FakeNode>()
    innerFirst.add('popup', inner, 'inner')
    innerFirst.add('popup', outer, 'outer')
    const outerFirst = new ElementRegistry<FakeNode>()
    outerFirst.add('popup', outer, 'outer')
    outerFirst.add('popup', inner, 'inner')

    expect(innerFirst.surfaceFor(node)).toBe('inner')
    expect(outerFirst.surfaceFor(node)).toBe('inner')
    expect(outerFirst.surfaceFor(new FakeNode(outer))).toBe('outer')
  })
})
