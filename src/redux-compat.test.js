/* global test, expect, jest */
import { createBus, createReduxMiddleware } from './bus'
import { createStore, applyMiddleware } from 'redux'
import 'rxjs'
import { createEpicMiddleware } from 'redux-observable'
import createSagaMiddleware from 'redux-saga'
import { put, takeLatest } from 'redux-saga/effects'
import configureMockStore from 'redux-mock-store'

test('can create a redux middleware that repeats all redux actions into bus', () => {
  // Given
  const b = createBus()
  let cb = jest.fn()
  const channel = 'FROM_REDUX'
  const data = {id: 10, type: channel}
  const mw = createReduxMiddleware(b)

  // When
  b.take(channel, cb)
  let store = createStore(
    (a) => a,
    applyMiddleware(mw)
  )
  store.dispatch(data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
})

test('can create a redux middleware that let actions go to redux store before sending to suber', (done) => {
  // Given
  const b = createBus()
  const channel = 'FROM_MOCK_REDUX'
  const data = {id: 10, type: channel}
  const mw = createReduxMiddleware(b)
  const mockStore = configureMockStore([mw])
  const store = mockStore({
    state: {}
  })

  // When
  b.take(channel, (action) => {
    // Then
    expect(store.getActions()).toEqual([
      data
    ])
    done()
  })
  store.dispatch(data)
})

test('exposes b.applyReduxMiddleware with same mw signature as redux', () => {
  // Given
  const b = createBus()
  let cb = jest.fn()
  const channel = 'TO_REDUX_MW'
  const data = {id: 10}
  let actualInput = null
  const expectedInput = Object.assign({}, data, {type: channel, source: 'app'})
  const mw = (store) => {
    expect(store.getState).toBeDefined()
    expect(store.dispatch).toBeDefined()
    return (next) => {
      expect(next).toBeDefined()
      return (data) => {
        actualInput = data
      }
    }
  }

  // When
  b.applyReduxMiddleware(mw)
  b.take(channel, cb)
  b.send(channel, data)

  // Then
  expect(cb).toHaveBeenCalledWith(data)
  expect(actualInput).toEqual(expectedInput)
})

test('works with redux-observable', () => {
  // Given
  const b = createBus()
  let cb = jest.fn()
  const PING = 'PING'
  const PONG = 'PONG'
  const pingEpic = action$ =>
    action$.ofType(PING)
      .mapTo({ type: PONG })
  const epicMiddleware = createEpicMiddleware(pingEpic)

  // When
  b.applyReduxMiddleware(epicMiddleware)
  b.take(PONG, cb)
  b.send(PING)

  // Then
  expect(cb).toHaveBeenCalledTimes(1)
})

test('works with redux-saga', () => {
  // Given
  const b = createBus()
  let cb = jest.fn()
  const PING = 'PING2'
  const PONG = 'PONG2'
  function * mySaga () {
    yield takeLatest(PING, function * mapPing (action) {
      yield put({ type: PONG })
    })
  }

  const sagaMiddleware = createSagaMiddleware()

  // When
  b.applyReduxMiddleware(sagaMiddleware)
  sagaMiddleware.run(mySaga)
  b.take(PONG, cb)
  b.send(PING)

  // Then
  expect(cb).toHaveBeenCalledTimes(1)
})
