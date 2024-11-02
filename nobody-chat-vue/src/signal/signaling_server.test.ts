import {
  NetSocketSendData,
  type NetSocketDataType,
  type RegisterSocketEventable,
  type SocketSendable
} from '@/net/netsocket'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { NormalSS, type SignalingServer } from './signaling_server'
import type { SignalInfo } from '@/models'

describe('test signaling server', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  let fakeSocket: RegisterSocketEventable & SocketSendable = new FakeSocket()
  let onEvent = false

  it('register request video', () => {
    const timestamp = new Date().getTime()
    const EXPECTED_SI = {
      from_id: '001',
      to_id: '002',
      signal_type: 'requestVideo',
      value: timestamp.toString()
    } as SignalInfo
    const ss: SignalingServer = new NormalSS(fakeSocket)
    ss.registerEvent('requestVideo', async (si) => {
      onEvent = true
      expect(si).not.toBeNull()
      expect(si.from_id).toBe(EXPECTED_SI.from_id)
      expect(si.to_id).toBe(EXPECTED_SI.to_id)
      expect(si.signal_type).toBe(EXPECTED_SI.signal_type)
      expect(si.value).toBe(EXPECTED_SI.value)
    })
    emitSocket(
      fakeSocket as any,
      NetSocketSendData.newSignalRequest(EXPECTED_SI.from_id, EXPECTED_SI.to_id, timestamp)
    )

    expect(onEvent).toBeTruthy()
  })

  it('register offer', () => {
    const EXPECTED_SI = {
      from_id: '001',
      to_id: '002',
      signal_type: 'offer',
      value: ''
    } as SignalInfo
    const ss: SignalingServer = new NormalSS(fakeSocket)
    ss.registerEvent('offer', async (si) => {
      onEvent = true
      expect(si).not.toBeNull()
      expect(si.from_id).toBe(EXPECTED_SI.from_id)
      expect(si.to_id).toBe(EXPECTED_SI.to_id)
      expect(si.signal_type).toBe(EXPECTED_SI.signal_type)
      expect(si.value).toBe(EXPECTED_SI.value)
    })
    emitSocket(
      fakeSocket as any,
      NetSocketSendData.newSignalOffer(EXPECTED_SI.from_id, EXPECTED_SI.to_id, EXPECTED_SI.value)
    )

    expect(onEvent).toBeTruthy()
  })
})

function emitSocket(socket: any, data: NetSocketSendData) {
  socket.emit(data)
}

const FakeSocket = vi.fn()

FakeSocket.mockImplementation(() => ({
  events: new Map(),

  registerEvent(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    event: (entry: NetSocketDataType) => void
  ): void {
    this.events.set(msgType, event)
  },

  emit(data: NetSocketSendData) {
    const keys = Object.keys(data.msg_type)
    let msg = this.events.get(keys[0])
    if (msg === undefined) {
      throw 'not event'
    }

    msg(data.msg_type)
  }
}))
