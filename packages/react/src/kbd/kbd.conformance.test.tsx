import { describeConformance } from '../../test/conformance.js'
import { Kbd } from './index.js'

describeConformance('Kbd', [
  {
    name: 'Kbd.Root',
    render: (p) => <Kbd.Root keys="mod+k" platform="apple" {...p} />,
    state: { platform: 'apple' },
  },
  {
    name: 'Kbd.Key',
    render: (p) => <Kbd.Key {...p}>K</Kbd.Key>,
  },
])
