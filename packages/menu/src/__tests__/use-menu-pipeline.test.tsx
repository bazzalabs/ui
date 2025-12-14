import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMenuPipeline } from '../pipeline/use-menu-pipeline.js'
import type { MenuDef } from '../types.js'

describe('useMenuPipeline', () => {
  describe('minLength threshold support', () => {
    describe('deep search (minLength as number)', () => {
      it('should not execute deep search loaders when query is below minLength', () => {
        const loader = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 3 },
          nodes: [
            { kind: 'item', id: 'local-item', label: 'Local Item' },
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              loader,
              deepSearch: true,
              search: { minLength: 3 },
              nodes: [],
            },
          ],
        }

        renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'ab', // 2 characters, below minLength of 3
          }),
        )

        // Loader should be called but with isOpen: false (disabled)
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'ab',
            isOpen: false,
          }),
        )
      })

      it('should execute deep search loaders when query meets minLength', () => {
        const loader = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 3 },
          nodes: [
            { kind: 'item', id: 'local-item', label: 'Local Item' },
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              loader,
              deepSearch: true,
              search: { minLength: 3 },
              nodes: [],
            },
          ],
        }

        renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'abc', // 3 characters, meets minLength of 3
          }),
        )

        // Loader should be called with isOpen: true (enabled)
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'abc',
            isOpen: true,
          }),
        )
      })

      it('should use shallow filtering when query is below deep minLength', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 3 },
          nodes: [
            { kind: 'item', id: 'item1', label: 'Item One' },
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              deepSearch: true,
              search: { minLength: 3 },
              nodes: [
                { kind: 'item', id: 'nested-item', label: 'Nested Item' },
              ],
            },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'it', // 2 characters, below minLength of 3
          }),
        )

        // Should still show filtered local results (shallow mode)
        // The nested item should NOT appear since query < deep minLength
        const displayedIds = result.current.displayNodes.map((n) => n.id)
        expect(displayedIds).toContain('item1')
        expect(displayedIds).not.toContain('nested-item')
      })

      it('should use deep filtering when query meets deep minLength', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 3 },
          nodes: [
            { kind: 'item', id: 'item1', label: 'Local Item' },
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              deepSearch: true,
              search: { minLength: 3 },
              nodes: [
                { kind: 'item', id: 'nested-item', label: 'Nested Item' },
              ],
            },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'item', // 4 characters, meets minLength of 3
          }),
        )

        // Both local and nested items should appear (deep mode)
        const displayedIds = result.current.displayNodes.map((n) => n.id)
        expect(displayedIds).toContain('item1')
        expect(displayedIds).toContain('nested-item')
      })
    })

    describe('deep search (minLength as object with deep property)', () => {
      it('should respect minLength.deep for deep search threshold', () => {
        const loader = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: { deep: 4 } },
          nodes: [
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              loader,
              deepSearch: true,
              search: { minLength: { deep: 4 } },
              nodes: [],
            },
          ],
        }

        const { rerender } = renderHook(
          (props: { query: string }) =>
            useMenuPipeline({
              menuDef,
              open: true,
              query: props.query,
            }),
          { initialProps: { query: 'abc' } }, // 3 chars, below threshold
        )

        // Should not execute loader with 3 chars
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: false }),
        )

        loader.mockClear()

        // Update to 4 chars
        rerender({ query: 'abcd' })

        // Should execute loader with 4 chars
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: true }),
        )
      })
    })

    describe('local search (minLength.local)', () => {
      it('should not filter locally when query is below minLength.local', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: { local: 2, deep: 4 } },
          nodes: [
            { kind: 'item', id: 'apple', label: 'Apple' },
            { kind: 'item', id: 'banana', label: 'Banana' },
            { kind: 'item', id: 'cherry', label: 'Cherry' },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'a', // 1 character, below local minLength of 2
          }),
        )

        // Should show all items (browse mode) since query < local minLength
        expect(result.current.displayNodes).toHaveLength(3)
      })

      it('should filter locally when query meets minLength.local', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: { local: 2, deep: 4 } },
          nodes: [
            { kind: 'item', id: 'apple', label: 'Apple' },
            { kind: 'item', id: 'banana', label: 'Banana' },
            { kind: 'item', id: 'cherry', label: 'Cherry' },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'ap', // 2 characters, meets local minLength of 2
          }),
        )

        // Should filter to only matching items
        const displayedIds = result.current.displayNodes.map((n) => n.id)
        expect(displayedIds).toContain('apple')
        expect(displayedIds).not.toContain('banana')
        expect(displayedIds).not.toContain('cherry')
      })

      it('should use deep filtering when query meets both local and deep minLength', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: { local: 2, deep: 4 } },
          nodes: [
            { kind: 'item', id: 'apple-item', label: 'Apple Item' },
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              deepSearch: true,
              search: { minLength: { deep: 4 } },
              nodes: [
                { kind: 'item', id: 'apple-nested', label: 'Apple Nested' },
              ],
            },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'apple', // 5 characters, meets both thresholds
          }),
        )

        // Both local and nested items should appear
        const displayedIds = result.current.displayNodes.map((n) => n.id)
        expect(displayedIds).toContain('apple-item')
        expect(displayedIds).toContain('apple-nested')
      })
    })

    describe('per-submenu minLength thresholds', () => {
      it('should respect different minLength thresholds for different submenus', () => {
        const loader1 = vi.fn(() => ({ data: [], isLoading: false }))
        const loader2 = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          nodes: [
            {
              kind: 'submenu',
              id: 'submenu1',
              label: 'Submenu 1',
              loader: loader1,
              deepSearch: true,
              search: { minLength: 2 },
              nodes: [],
            },
            {
              kind: 'submenu',
              id: 'submenu2',
              label: 'Submenu 2',
              loader: loader2,
              deepSearch: true,
              search: { minLength: 4 },
              nodes: [],
            },
          ],
        }

        renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'abc', // 3 characters
          }),
        )

        // loader1 should be called (minLength: 2 met)
        expect(loader1).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: true }),
        )

        // loader2 should NOT be called (minLength: 4 not met)
        expect(loader2).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: false }),
        )
      })
    })

    describe('edge cases', () => {
      it('should handle minLength of 0 (no threshold)', () => {
        const loader = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 0 },
          nodes: [
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              loader,
              deepSearch: true,
              search: { minLength: 0 },
              nodes: [],
            },
          ],
        }

        renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'a', // Any query should trigger deep search
          }),
        )

        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: true }),
        )
      })

      it('should handle empty query (no filtering)', () => {
        const menuDef: MenuDef = {
          id: 'test-menu',
          search: { minLength: 2 },
          nodes: [
            { kind: 'item', id: 'item1', label: 'Item 1' },
            { kind: 'item', id: 'item2', label: 'Item 2' },
          ],
        }

        const { result } = renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: '', // Empty query
          }),
        )

        // Should show all items in browse mode
        expect(result.current.displayNodes).toHaveLength(2)
      })

      it('should handle missing search config (no minLength)', () => {
        const loader = vi.fn(() => ({ data: [], isLoading: false }))

        const menuDef: MenuDef = {
          id: 'test-menu',
          nodes: [
            {
              kind: 'submenu',
              id: 'submenu',
              label: 'Submenu',
              loader,
              deepSearch: true,
              nodes: [],
            },
          ],
        }

        renderHook(() =>
          useMenuPipeline({
            menuDef,
            open: true,
            query: 'a', // Any query should work
          }),
        )

        // With no minLength config, default to 0 (immediate)
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: true }),
        )
      })
    })
  })
})
