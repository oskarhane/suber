import { v4 } from 'uuid'

const subscriptions = {}
let emitTo = null

const addChannelSubscriber = (channel, fn, filterFn, once) => {
  subscriptions[channel] = subscriptions[channel] || {}
  const id = v4()
  const unsub = createUnsub(channel, id)
  const newFn = once !== true ? fn : (message) => (unsub() && fn(message))
  subscriptions[channel][id] = {
    fn: newFn,
    filterFn
  }
  return unsub
}
const createUnsub = (channel, id) => () => delete subscriptions[channel][id]
const sendMessageToSubscribers = (channel, message) => {
  if (typeof subscriptions[channel] === 'undefined') {
    return
  }
  const subs = subscriptions[channel]
  Object.keys(subs).forEach((key) => {
    const sub = subs[key]
    if (sub.filterFn) {
      if (!sub.filterFn(message)) return
    }
    sub.fn(message)
  })
}

const take = (channel, fn, filterFn = null, once = false) => {
  if (!channel || !fn) return false
  return addChannelSubscriber(channel, fn, filterFn, once)
}
const once = (channel, fn, filterFn) => take(channel, fn, filterFn, true)

const send = (channel, message, source = 'app') => {
  if (!channel) return false
  sendMessageToSubscribers(channel, message)
  if (emitTo) emitTo(channel, message, source)
}

const bus = {
  subscriptions,
  take,
  once,
  send
}

export const getBus = () => bus
export const emitFn = (fn) => emitTo = fn
export const createReduxMiddleware = () => (next) => (action) => {
  bus.send(action.type, action, 'redux')
  return next(action)
}
