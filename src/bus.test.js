/* global describe, beforeEach, test, expect, jest */
import { createBus } from './bus'

describe('Suber core testing', () => {
  let b = null
  beforeEach(() => {
    b = createBus()
  })

  test('can send messages on the bus', () => {
    // Given
    let cb = jest.fn()
    const channel = 'my channel'
    const data = {id: 1}

    // When
    b.take(channel, cb)

    // Then
    expect(b.send).toBeDefined()
    expect(cb).not.toHaveBeenCalled()

    // When
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledWith(data)
  })

  test('reset removes all subscribers', () => {
    // Given
    let cb = jest.fn()
    const channel = 'my channel'
    const data = {id: 1}

    // When
    b.take(channel, cb)
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledWith(data)
    expect(cb).toHaveBeenCalledTimes(1)

    // When
    b.reset()
    b.send(channel, data)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('can take one or multiple messages', () => {
    // Given
    let cb = jest.fn()
    let cb2 = jest.fn()
    const channel = 'my channel'
    const data = {id: 1}

    // When
    b.take(channel, cb)
    b.one(channel, cb2)

    b.send(channel, data)
    b.send(channel, data)
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledTimes(3)
    expect(cb2).toHaveBeenCalledTimes(1)
  })

  test('self passes on `_responseChannel` to tell subs where to respond', () => {
    // Given
    const b = createBus()
    let cb = jest.fn()
    const data = {id: 1}
    const data2 = {id: 2}
    const cb2 = (data) => {
      b.send(data._responseChannel, data2)
    }
    const channel = 'my channel'

    // When
    b.take(channel, cb2)
    b.self(channel, data, cb)

    // Then
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(data2)
  })

  test('can have multiple subscribers for a channel', () => {
    // Given
    let cb1 = jest.fn()
    let cb2 = jest.fn()
    let cb3 = jest.fn()
    const channel = 'my channel 2'
    const nonSentchannel = 'nochannel'
    const data = {id: 2}

    // When
    b.take(channel, cb1)
    b.take(channel, cb2)
    b.take(nonSentchannel, cb3)
    b.send(channel, data)

    // Then
    expect(cb1).toHaveBeenCalledWith(data)
    expect(cb2).toHaveBeenCalledWith(data)
    expect(cb3).not.toHaveBeenCalled()
  })

  test('can catch all messages with "*" channel', () => {
    // Given
    let cb1 = jest.fn()
    let cb2 = jest.fn()
    let catchAllCb = jest.fn()
    const channel = 'my channel 2'
    const noSubscriberChannel = 'no direct subscribers'
    const data = {id: 2}

    // When
    b.take(channel, cb1)
    b.take(channel, cb2)
    b.take('*', catchAllCb)
    b.send(channel, data)
    b.send(noSubscriberChannel, data)

    // Then
    expect(cb1).toHaveBeenCalledWith(data)
    expect(cb2).toHaveBeenCalledWith(data)
    expect(catchAllCb).toHaveBeenCalledTimes(2)
  })

  test('subscribers filter function', () => {
    // Given
    let cb = jest.fn()
    let cb2 = jest.fn()
    const channel = 'filter channel'
    const filterFn = (data) => data.id === 1
    const filterFn2 = (data) => data.id === 2
    const data = {id: 1}

    // When
    b.take(channel, cb, filterFn)
    b.take(channel, cb2, filterFn2)
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledWith(data)
    expect(cb2).not.toHaveBeenCalled()
  })

  test('subscribers can unsubscribe', () => {
    // Given
    let cb = jest.fn()
    const channel = 'my unsub channel'
    const data = {id: 1}

    // When
    const unsub = b.take(channel, cb)
    expect(unsub).toBeTruthy()
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledWith(data)

    // When
    unsub()
    b.send(channel, data)

    //
    expect(cb).toHaveBeenCalledTimes(1)
  })
  test('bus is not global', () => {
    // Given
    const b = createBus()
    const c = createBus()
    let cb = jest.fn()
    let cb2 = jest.fn()
    const data = {id: 1}
    const channel = 'my channel'

    // When
    b.take(channel, cb)
    c.take(channel, cb2)
    b.send(channel, data)

    // Then
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(data)
    expect(cb2).toHaveBeenCalledTimes(0)
  })
})

describe('Utility functions', () => {
  let b = null
  beforeEach(() => {
    b = createBus()
    b.reset()
  })
  test('exposes applyMiddleware', () => {
    // Given
    let cb = jest.fn()
    let myInnerMw = jest.fn()
    let myMw = (send) => myInnerMw
    const channel = 'emitSubject'
    const data = {id: 10}
    const source = 'test'

    // When
    b.take(channel, cb)
    b.applyMiddleware(myMw)
    b.send(channel, data, source)

    // Then
    expect(cb).toHaveBeenCalledWith(data)
    expect(myInnerMw).toHaveBeenCalledWith(channel, data, source)
  })
  test('exposes resetMiddlewares', () => {
    // Given
    const b = createBus()
    let cb = jest.fn()
    let myInnerMw = jest.fn()
    let myMw = (send) => myInnerMw
    const channel = 'emitSubject'
    const data = {id: 10}
    const source = 'test'

    // When
    b.take(channel, cb)
    b.applyMiddleware(myMw)
    b.send(channel, data, source)

    // Then
    expect(cb).toHaveBeenCalledWith(data)
    expect(myInnerMw).toHaveBeenCalledWith(channel, data, source)

    // When
    b.resetMiddlewares()
    b.send(channel, data, source)

    // Then
    expect(cb).toHaveBeenCalledTimes(2)
    expect(myInnerMw).toHaveBeenCalledTimes(1)
  })
})
