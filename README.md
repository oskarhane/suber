# suber - a message bus
Very much WIP at the moment.

## API
`const bus = getBus()` - gives you the bus. It's a singleton bus, you cannot have multiple instances.

`bus.take('TYPE', fn[, filterFn])` - Subscribes for messages of type `'TYPE'` and `fn` will be called when matching messages arrive. The _optional_ `filterFn` can be provided to only get called when the provided data passes the `filterFn`.

`bus.send('TYPE', data)` - Send data on the bus.

## Usage

```javascript
// Import (not available yet)
import { getBus } from '@oskarhane/suber'

// Get bus
const bus = getBus()

// Listen until manual unsubscription
const unsub = bus.take('MY_TYPE', (data) => {
  console.log(data)
})
// or just once
bus.once('MY_TYPE', (data) => {
  console.log(data)
})

// Send
bus.send('MY_TYPE', 'Hello world')
```

## Development setup

```bash
yarn
npm test
```
