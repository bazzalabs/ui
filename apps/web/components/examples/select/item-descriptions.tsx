'use client'

import { useState } from 'react'
import { Select } from '@/registry/select'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react'

export function ItemDescriptions() {
  const [value, setValue] = useState('pending')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="Select status..."
        items={[
          {
            value: 'success',
            label: 'Success',
            description: 'Everything went well',
            icon: <CheckCircleIcon className="text-green-500" />,
          },
          {
            value: 'pending',
            label: 'Pending',
            description: 'Waiting for completion',
            icon: <ClockIcon className="text-yellow-500" />,
          },
          {
            value: 'error',
            label: 'Error',
            description: 'Something went wrong',
            icon: <XCircleIcon className="text-red-500" />,
          },
          {
            value: 'cancelled',
            label: 'Cancelled',
            description: 'Operation was cancelled',
            icon: <XCircleIcon className="text-gray-500" />,
          },
        ]}
      >
        <Button variant="outline" className="w-56">
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select...'}
        </Button>
      </Select>
    </div>
  )
}
