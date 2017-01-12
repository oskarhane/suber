import { v4 } from 'uuid'

const subscriptions = {}
let emitTo = null

const addTypeSubscriber = (type, fn, filterFn, once) => {
  subscriptions[type] = subscriptions[type] || {}
  const id = v4()
  const unsub = createUnsub(type, id)
  const newFn = once !== true ? fn : (data) => (unsub() && fn(data))
  subscriptions[type][id] = {
    fn: newFn,
    filterFn
  }
  return unsub
}
const createUnsub = (type, id) => () => delete subscriptions[type][id]
const sendDataToSubscribers = (type, data) => {
  if (typeof subscriptions[type] === 'undefined') {
    return
  }
  const subs = subscriptions[type]
  Object.keys(subs).forEach((key) => {
    const sub = subs[key]
    if (sub.filterFn) {
      if (!sub.filterFn(data)) return
    }
    sub.fn(data)
  })
}

const take = (type, fn, filterFn = null, once = false) => {
  if (!type || !fn) return false
  return addTypeSubscriber(type, fn, filterFn, once)
}
const once = (type, fn, filterFn) => take(type, fn, filterFn, true)

const send = (type, data, source = 'app') => {
  if (!type) return false
  sendDataToSubscribers(type, data)
  if (emitTo) emitTo(type, data, source)
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
