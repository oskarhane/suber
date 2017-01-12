/* global test, expect, jest */
import { getBus, emitFn, createReduxMiddleware } from './bus'

test('can get the bus', () => {
  // Given
  const b = getBus()

  // Then
  expect(b).toBeTruthy()
})

test('will fail to register an empty listener', () => {
  // Given
  const b = getBus()

  // When
  b.take('any type', null)

  // Then
  expect(b.subscriptions['any type']).toBeUndefined()
})

test('can register to take messages on the bus', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()

  // When
  b.take('any type', cb)

  // Then
  expect(Object.keys(b.subscriptions)).toEqual(['any type'])
  expect(Object.keys(b.subscriptions['any type']).length).toBe(1)
  expect(cb).not.toHaveBeenCalled()
})

test('can send messages on the bus', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  const type = 'my type'
  const data = {id: 1}

  // When
  b.take(type, cb)

  // Then
  expect(b.send).toBeDefined()
  expect(cb).not.toHaveBeenCalled()

  // When
  b.send(type, data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
})

test('can take one or multiple messages', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  let cb2 = jest.fn()
  const type = 'my type'
  const data = {id: 1}

  // When
  b.take(type, cb)
  b.once(type, cb2)

  b.send(type, data)
  b.send(type, data)
  b.send(type, data)

  // Then
  expect(cb).toHaveBeenCalledTimes(3)
  expect(cb2).toHaveBeenCalledTimes(1)
})

test('can have multiple subscribers for a type', () => {
  // Given
  const b = getBus()
  let cb1 = jest.fn()
  let cb2 = jest.fn()
  let cb3 = jest.fn()
  const type = 'my type 2'
  const nonSentType = 'notype'
  const data = {id: 2}

  // When
  b.take(type, cb1)
  b.take(type, cb2)
  b.take(nonSentType, cb3)
  b.send(type, data)

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
  const type = 'filter type'
  const filterFn = (data) => data.id === 1
  const filterFn2 = (data) => data.id === 2
  const data = {id: 1}

  // When
  b.take(type, cb, filterFn)
  b.take(type, cb2, filterFn2)
  b.send(type, data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(cb2).not.toHaveBeenCalled()
})

test('subscribers can unsubscribe', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  const type = 'my unsub type'
  const data = {id: 1}

  // When
  const unsub = b.take(type, cb)
  expect(unsub).toBeTruthy()
  b.send(type, data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)

  // When
  unsub()
  b.send(type, data)

  //
  expect(cb).toHaveBeenCalledTimes(1)
})

test('bus emits messages with emitFn', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  let myEmitFn = jest.fn()
  const type = 'emitSubject'
  const data = {id: 10}

  // When
  b.take(type, cb)
  emitFn(myEmitFn)
  b.send(type, data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(myEmitFn).toHaveBeenCalledWith(type, data)
})

test('can create a redux middleware that repeats all redux actions into bus', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  const type = 'FROM_REDUX'
  const data = {id: 10, type}
  const reduxAction = data
  const reduxNext = jest.fn()
  const reduxFn = (mw) => mw(reduxNext)(reduxAction)
  const mw = createReduxMiddleware()

  // When
  b.take(type, cb)
  reduxFn(mw) // Fake call from redux

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(reduxNext).toHaveBeenCalledWith(data)
})
