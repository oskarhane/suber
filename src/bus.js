// Private utility functions
const addChannelSubscriber = (channel, fn, filterFn, once) => {
  subscriptions[channel] = subscriptions[channel] || {}
  const id = nextId++
  const unsub = createUnsub(channel, id)
  const newFn = once !== true ? fn : (message) => (unsub() && fn(message))
  subscriptions[channel][id] = { fn: newFn, filterFn }
  return unsub
}
const createUnsub = (channel, id) => () => delete subscriptions[channel][id]
const sendMessageToSubscribers = (channel, message) => {
  if (!subscriptions[channel]) return
  Object.keys(subscriptions[channel]).forEach((key) => {
    const sub = subscriptions[channel][key]
    if (sub.filterFn) {
      if (!sub.filterFn(message)) return
    }
    sub.fn(message)
  })
}

// Exposed bus methods
const take = (channel, fn, filterFn = null, once = false) => {
  if (!channel || !fn) return false
  return addChannelSubscriber(channel, fn, filterFn, once)
}
const one = (channel, fn, filterFn) => take(channel, fn, filterFn, true)
const send = (channel, message, source = 'app') => {
  if (!channel) return
  sendMessageToSubscribers(channel, message)
  if (emitTo) emitTo(channel, message, source)
}

// Local variables / constants
let nextId = 0
let emitTo = null
const subscriptions = {}
const bus = { take, one, send }

// Exported functions
export const getBus = () => bus
export const emitFn = (fn) => (emitTo = fn)
export const createReduxMiddleware = () => (next) => (action) => {
  bus.send(action.type, action, 'redux')
  return next(action)
}
