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
    setTimeout(((sub) => sub.fn(message))(sub), 0)
  })
}
const sendMessageToMiddlewares = (channel, message, source) => {
  middlewares.forEach((mw) => {
    setTimeout((() => mw(send)(channel, message, source))(mw), 0)
  })
}
const wrapReduxMiddleware = (mw) => {
  return (send) => (channel, message, source) => {
    const action = Object.assign({}, message, {type: channel, source: source})
    const dispatch = (action) => send(action.type, action)
    const store = { getState: () => null, dispatch }
    const next = () => {}
    mw(store)(next)(action)
  }
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
  sendMessageToMiddlewares(channel, message, source)
}

// Local variables / constants
let nextId = 0
const subscriptions = {}
const middlewares = []
const bus = { take, one, send }

// Exported functions
export const getBus = () => bus
export const createReduxMiddleware = () => (next) => (action) => {
  bus.send(action.type, action, 'redux')
  return next(action)
}
export function applyMiddleware () {
  Array.from(arguments).forEach((arg) => middlewares.push(arg))
}
export function applyReduxMiddleware () {
  Array.from(arguments).forEach((arg) => {
    const compat = wrapReduxMiddleware(arg)
    middlewares.push(compat)
  })
}

