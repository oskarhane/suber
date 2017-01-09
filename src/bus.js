import { v4 } from 'uuid'

const subscriptions = {}
let emitTo = null

const addSubscriptionType = (type) => {
  subscriptions[type] = subscriptions[type] || {}
}
const addTypeSubscriber = (type, fn, filterFn) => {
  addSubscriptionType(type)
  const id = v4()
  subscriptions[type][id] = {
    fn,
    filterFn
  }
  return createUnsub(type, id)
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

const take = (type, fn, filterFn = null) => {
  if (!type || !fn) return false
  return addTypeSubscriber(type, fn, filterFn)
}

const send = (type, data) => {
  if (!type) return false
  sendDataToSubscribers(type, data)
  if (emitTo) emitTo(type, data)
}

const bus = {
  subscriptions,
  take,
  send
}

export const getBus = () => bus
export const emitFn = (fn) => emitTo = fn
export const createReduxMiddleware = () => (next) => (action) => {
  bus.send(action.type, action)
  return next(action)
}
