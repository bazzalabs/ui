/**
 * Test file to verify compound component API works correctly.
 * This file is for testing purposes only and should not be committed.
 */

import React from 'react'
import { createSelect } from './src/create-select.js'

// Create a select instance
const MySelect = createSelect()

// Test 1: Legacy API (should still work)
function Test1() {
  return (
    <MySelect
      items={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]}
    />
  )
}

// Test 2: Compound component with default trigger
function Test2() {
  return (
    <MySelect
      items={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]}
    >
      <MySelect.Trigger>
        <MySelect.Value />
      </MySelect.Trigger>
    </MySelect>
  )
}

// Test 3: Compound component with asChild
function Test3() {
  return (
    <MySelect
      items={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]}
    >
      <MySelect.Trigger asChild>
        <button>
          <MySelect.Value placeholder="Choose..." />
        </button>
      </MySelect.Trigger>
    </MySelect>
  )
}

// Test 4: TypeScript type checking - should have correct types
function Test4() {
  const select = createSelect()

  // These should be available and properly typed
  const _Trigger = select.Trigger
  const _Value = select.Value

  // Verify types are correct
  const _trigger: React.FC<{ asChild?: boolean }> = select.Trigger
  const _value: React.FC<{ placeholder?: string }> = select.Value

  // Use them to avoid unused variable warnings
  console.log(_Trigger, _Value, _trigger, _value)

  return null
}

export { Test1, Test2, Test3, Test4 }
