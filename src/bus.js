export const createBus = () => {
  const getId = () => nextId++
  const addChannelSubscriber = (channel, fn, filterFn, once) => {
    subscriptions[channel] = subscriptions[channel] || {}
    const id = getId()
    const stopFn = createStopFn(channel, id)
    const newFn = once !== true ? fn : (message) => (stopFn() && fn(message))
    subscriptions[channel][id] = { fn: newFn, filterFn: (filterFn || (() => true)) }
    return stopFn
  }
  const createStopFn = (channel, id) => () => delete subscriptions[channel][id]
  const getChannelSubscribers = (channel) => {
    return (Object.keys(subscriptions[channel] || {}) || [])
                  .map((key) => subscriptions[channel][key])
  }
  const sendMessageToSubscribers = (channel, message) => {
    getChannelSubscribers('*').concat(getChannelSubscribers(channel)).forEach((sub) => {
      sub.filterFn(message) && sub.fn(message)
    })
  }
  const sendMessageToMiddlewares = (channel, message, source) => {
    middlewares.forEach((mw) => {
      mw(channel, message, source)
    })
  }
  const wrapReduxMiddleware = (mw) => {
    return (send) => {
      const dispatch = (action) => send(action.type, action)
      const store = { getState: () => null, dispatch }
      const partialMw = mw(store)
      return (channel, message, source) => {
        const action = Object.assign({}, message, {type: channel, source: source})
        const next = (a) => a
        partialMw(next)(action)
      }
    }
  }

  const reset = () => Object.keys(subscriptions).forEach((key) => delete subscriptions[key])
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
  const _self = (channel, message, fn) => {
    const $$responseChannel = 'SELF_REF_' + getId()
    one($$responseChannel, fn)
    send(channel, Object.assign({}, message, { $$responseChannel }))
  }

  // Local variables / constants
  let nextId = 0
  const subscriptions = {}
  let middlewares = []
  const _originObject = { '$$origin': 'suber' }

  // Exposed functions
  return {
    reset,
    take,
    one,
    send,
    self: _self,
    applyMiddleware: function () {
      Array.from(arguments).forEach((arg) => middlewares.push(arg(send, _originObject)))
    },
    applyReduxMiddleware: function () {
      Array.from(arguments).forEach((arg) => {
        const compat = wrapReduxMiddleware(arg)(send)
        middlewares.push(compat)
      })
    },
    resetMiddlewares: () => {
      middlewares = []
    }
  }
}
export const createReduxMiddleware = (bus) => () => (next) => (action) => {
  const res = next(action)
  if (!_isSuberOrigin(action)) bus.send(action.type, action, 'redux')
  return res
}

const _isSuberOrigin = (action) => {
  return action['$$origin'] && action['$$origin'] === 'suber'
}

