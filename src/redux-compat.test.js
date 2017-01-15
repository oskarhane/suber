/* global test, expect, jest */
import { getBus, applyReduxMiddleware } from './bus'
import 'rxjs'
import { createEpicMiddleware } from 'redux-observable'

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
