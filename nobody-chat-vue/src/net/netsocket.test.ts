import { expect, describe, it, beforeAll, afterAll } from 'vitest'
import {
  type Msg,
  NetSocket,
  type NetSocketDataType,
  NetSocketRecvData,
  type SetUser,
  type Signal,
  type UserOffline,
  type UserOnline
} from './netsocket'
import WS from 'vitest-websocket-mock'

describe('test init NetSocket', () => {
  let server: WS
  beforeAll(async () => {
    const addr = import.meta.env.VITE_API_ADDRESS
    const url = `ws://${addr}ws`
    server = new WS(url, { jsonProtocol: true })
  })

  it('init', async () => {
    new NetSocket()
    await server.connected
  })

  it('register setUser', async () => {
    const EXPECTED_ID = 'FAKE ID'
    const EXPECTED_NAME = 'FAKE NAME'

    const netSocket = new NetSocket()
    await server.connected

    await netSocket.registerEvent('setUser', (entry: NetSocketDataType) => {
      entry = entry as SetUser
      expect(entry).not.toBeNull()
      expect(entry).not.toBeUndefined()
      expect(Object.keys(entry).length).toBe(1)
      expect(entry.setUser).not.toBeNull()
      expect(entry.setUser).not.toBeUndefined()
      expect(entry.setUser.id).toBe(EXPECTED_ID)
      expect(entry.setUser.name).toBe(EXPECTED_NAME)
    })

    server.send(NetSocketRecvData.newSetUser({ id: EXPECTED_ID, name: EXPECTED_NAME }))
  })

  it('register UserOnline', async () => {
    const EXPECTED_ID = 'FAKE ID'
    const EXPECTED_NAME = 'FAKE NAME'

    const netSocket = new NetSocket()
    await server.connected

    await netSocket.registerEvent('userOnline', (entry: NetSocketDataType) => {
      entry = entry as UserOnline
      expect(entry).not.toBeNull()
      expect(entry).not.toBeUndefined()
      expect(Object.keys(entry).length).toBe(1)
      expect(entry.userOnline).not.toBeNull()
      expect(entry.userOnline).not.toBeUndefined()
      expect(entry.userOnline.id).toBe(EXPECTED_ID)
      expect(entry.userOnline.name).toBe(EXPECTED_NAME)
    })

    server.send(NetSocketRecvData.newUserOnline({ id: EXPECTED_ID, name: EXPECTED_NAME }))
  })

  it('register Msg', async () => {
    const EXPECTED_FROM = 'FAKE FROM'
    const EXPECTED_MSG = 'FAKE MSG'

    const netSocket = new NetSocket()
    await server.connected

    await netSocket.registerEvent('msg', (entry: NetSocketDataType) => {
      entry = entry as Msg
      expect(entry).not.toBeNull()
      expect(entry).not.toBeUndefined()
      expect(Object.keys(entry).length).toBe(1)
      expect(entry.msg).not.toBeNull()
      expect(entry.msg).not.toBeUndefined()
      expect(entry.msg.from).toBe(EXPECTED_FROM)
      expect(entry.msg.msg).toBe(EXPECTED_MSG)
    })

    server.send(NetSocketRecvData.newMsg({ from: EXPECTED_FROM, msg: EXPECTED_MSG }))
  })

  it('register UserOffline', async () => {
    const EXPECTED_ID = 'FAKE ID'
    const EXPECTED_NAME = 'FAKE NAME'

    const netSocket = new NetSocket()
    await server.connected

    await netSocket.registerEvent('userOffline', (entry: NetSocketDataType) => {
      entry = entry as UserOffline
      expect(entry).not.toBeNull()
      expect(entry).not.toBeUndefined()
      expect(Object.keys(entry).length).toBe(1)
      expect(entry.userOffline).not.toBeNull()
      expect(entry.userOffline).not.toBeUndefined()
      expect(entry.userOffline.id).toBe(EXPECTED_ID)
      expect(entry.userOffline.name).toBe(EXPECTED_NAME)
    })

    server.send(NetSocketRecvData.newUserOffline({ id: EXPECTED_ID, name: EXPECTED_NAME }))
  })

  it('register Signal', async () => {
    const EXPECTED_FROM_ID = 'FAKE FROM ID'
    const EXPECTED_TO_ID = 'FAKE FROM TO'
    const EXPECTED_TYPE = 'offer'
    const EXPECTED_VALUE = 'FAKE VALUE'

    const netSocket = new NetSocket()
    await server.connected

    await netSocket.registerEvent('userOffline', (entry: NetSocketDataType) => {
      entry = entry as Signal
      expect(entry).not.toBeNull()
      expect(entry).not.toBeUndefined()
      expect(Object.keys(entry).length).toBe(1)
      expect(entry.signal).not.toBeNull()
      expect(entry.signal).not.toBeUndefined()
      expect(entry.signal.from_id).toBe(EXPECTED_FROM_ID)
      expect(entry.signal.to_id).toBe(EXPECTED_TO_ID)
      expect(entry.signal.signal_type).toBe(EXPECTED_TYPE)
      expect(entry.signal.value).toBe(EXPECTED_VALUE)
    })

    server.send(
      NetSocketRecvData.newSignal({
        from_id: EXPECTED_FROM_ID,
        to_id: EXPECTED_TO_ID,
        signal_type: EXPECTED_TYPE,
        value: EXPECTED_VALUE
      })
    )
  })

  afterAll(() => {
    WS.clean()
  })
})
