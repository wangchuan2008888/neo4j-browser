import { expect } from 'chai'
import { put, call } from 'redux-saga/effects'
import frames from '../../main/frames'
import { handleServerCommand, handleServerAddCommand } from './serverCommand'
import settings from '../../settings'
import bolt from '../../services/bolt/bolt'

describe('serverCommandSagas', () => {
  describe('handleServerCommand Saga', () => {
    it('should create unknown frame for unknown commands', () => {
      // Given
      const payload = {cmd: ':unknown'}
      const storeSettings = {cmdchar: ':'}
      const handleServerCommandSaga = handleServerCommand(payload, storeSettings.cmdchar)

      // When
      const actualPutAction = handleServerCommandSaga.next().value
      const expectedPutAction = put(frames.actions.add({...payload, type: 'unknown'}))

      // Then
      // We cannot do deep equal here because of uuid
      expect(actualPutAction.PUT.action.state.type).to.equal(expectedPutAction.PUT.action.state.type)
    })

    it('should include errors on wrong :server add command format', () => {
      // Given
      const payload = {cmd: ':server add user:pass@server:8585'} // missing name
      const storeSettings = {cmdchar: ':'}
      const handleServerAddCommandSaga = handleServerAddCommand(payload, storeSettings.cmdchar)

      // When
      const actualPutAction = handleServerAddCommandSaga.next().value
      const expectedPutAction = put(frames.actions.add({...payload, errors: {}, type: 'cmd'}))

      // Then
      // We cannot do deep equal here because of uuid
      expect(actualPutAction.PUT.action.state.cmd).to.deep.equal(expectedPutAction.PUT.action.state.cmd)
      expect(actualPutAction.PUT.action.state.errors).to.not.be.undefined
    })

    it('should handle :server add command for adding server bookmarks', () => {
      // Given
      const conf = {
        name: 'myname',
        username: 'user',
        password: 'pass',
        host: 'server:7687'
      }
      const payload = {cmd: `:server add ${conf.name} ${conf.username}:${conf.password}@${conf.host}`}
      const storeSettings = {cmdchar: ':'}
      const handleServerAddCommandSaga = handleServerAddCommand(payload, storeSettings.cmdchar)

      // When
      const actualPutAction = handleServerAddCommandSaga.next().value
      const expectedPutAction = put(settings.actions.addServerBookmark(conf))

      // Then
      expect(actualPutAction).to.deep.equal(expectedPutAction)
    })

    it('should handle :server use command for switching connection', () => {
      // Given
      const connection = {name: 'myname'}
      const payload = {cmd: ':server use myname'}
      const storeSettings = {cmdchar: ':'}
      const handleServerCommandSaga = handleServerCommand(payload, storeSettings.cmdchar)

      // When
      const actualCallGetConnectionAction = handleServerCommandSaga.next().value
      const expectedCallGetConnectionAction = call(bolt.getConnection, connection.name)
      const actualCallUseConnectionAction = handleServerCommandSaga.next(connection).value
      const expectedCallUseConnectionAction = call(bolt.useConnection, connection.name)

      // Then
      expect(actualCallGetConnectionAction).to.deep.equal(expectedCallGetConnectionAction)
      expect(actualCallUseConnectionAction).to.deep.equal(expectedCallUseConnectionAction)
    })
  })
})
