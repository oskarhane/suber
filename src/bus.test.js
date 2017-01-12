/* global test, expect, jest */
import { getBus, emitFn, createReduxMiddleware } from './bus'

test('can get the bus', () => {
  // Given
  const b = getBus()

  // Then
  expect(b).toBeTruthy()
})

test('can send messages on the bus', () => {
  // Given
  const b = getBus()
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

test('can take one or multiple messages', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  let cb2 = jest.fn()
  const channel = 'my channel'
  const data = {id: 1}

  // When
  b.take(channel, cb)
  b.once(channel, cb2)

  b.send(channel, data)
  b.send(channel, data)
  b.send(channel, data)

  // Then
  expect(cb).toHaveBeenCalledTimes(3)
  expect(cb2).toHaveBeenCalledTimes(1)
})

test('can have multiple subscribers for a channel', () => {
  // Given
  const b = getBus()
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

test('subscribers filter function', () => {
  // Given
  const b = getBus()
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
  const b = getBus()
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

test('bus emits messages with emitFn', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  let myEmitFn = jest.fn()
  const channel = 'emitSubject'
  const data = {id: 10}
  const source = 'test'

  // When
  b.take(channel, cb)
  emitFn(myEmitFn)
  b.send(channel, data, source)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(myEmitFn).toHaveBeenCalledWith(channel, data, source)
})

test('can create a redux middleware that repeats all redux actions into bus', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  const channel = 'FROM_REDUX'
  const data = {id: 10, type: channel}
  const reduxAction = data
  const reduxNext = jest.fn()
  const reduxFn = (mw) => mw(reduxNext)(reduxAction)
  const mw = createReduxMiddleware()

  // When
  b.take(channel, cb)
  reduxFn(mw) // Fake call from redux

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(reduxNext).toHaveBeenCalledWith(data)
})
