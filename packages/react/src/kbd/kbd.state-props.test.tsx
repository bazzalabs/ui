import { describeStateProps } from '../../test/state-props.js'
import { Kbd } from './index.js'

describeStateProps('Kbd', [
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
