/* global test, expect, jest */
import { getBus, applyReduxMiddleware } from './bus'
import 'rxjs'
import { createEpicMiddleware } from 'redux-observable'
import createSagaMiddleware from 'redux-saga'
import { put, takeLatest } from 'redux-saga/effects'

test('works with redux-observable', () => {
  // Given
  const b = getBus()
  let cb = jest.fn()
  const PING = 'PING'
  const PONG = 'PONG'
  const pingEpic = action$ =>
    action$.ofType(PING)
      .mapTo({ type: PONG })
  const epicMiddleware = createEpicMiddleware(pingEpic)

  // When
  applyReduxMiddleware(epicMiddleware)
  b.take(PONG, cb)
  b.send(PING)

  // Then
  expect(cb).toHaveBeenCalledTimes(1)
})

test('works with redux-saga', () => {
  // Given
  const b = getBus()
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
  applyReduxMiddleware(sagaMiddleware)
  sagaMiddleware.run(mySaga)
  b.take(PONG, cb)
  b.send(PING)

  // Then
  expect(cb).toHaveBeenCalledTimes(1)
})
