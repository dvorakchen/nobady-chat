import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { SignalType, SignalInfo } from '@/models'
import { RTC121 } from './rtc_121'
import type { BaseSignal, One2OneSignalServer } from './one2one'
import { createPinia, setActivePinia } from 'pinia'

vi.stubGlobal(
  'RTCPeerConnection',
  vi.fn(() => ({}))
)
vi.stubGlobal(
  'RTCSessionDescription',
  vi.fn(() => ({}))
)

describe('test rtc_121', () => {
  beforeAll(() => {
    setActivePinia(createPinia())
  })

  const fakeSS = new FakeSS()

  it('init', () => {
    const rtc_121 = new RTC121('', '', fakeSS, buildPeerConnection())

    expect(rtc_121.localVideo).toBe('')
    expect(rtc_121.remoteVideo).toBe('')
  })

  it('register handle request', () => {
    const BASE_SIGNAL = {
      from_id: 'from_id',
      to_id: 'to_id'
    } as BaseSignal
    const EXPECTED_VALUE = 'vvvalue'
    let isSet = false

    const rtc_121: One2OneSignalServer = new RTC121('', '', fakeSS, buildPeerConnection())

    rtc_121.setBase(BASE_SIGNAL)
    rtc_121.handleRequest(async (signal) => {
      expect(signal).not.toBeNull()
      expect(signal.signal_type).toBe('requestVideo')
      expect(signal.from_id).toBe(BASE_SIGNAL.from_id)
      expect(signal.to_id).toBe(BASE_SIGNAL.to_id)
      expect(signal.value).toBe(EXPECTED_VALUE)
      isSet = true
      return false
    })

    emit(fakeSS, {
      from_id: BASE_SIGNAL.from_id,
      to_id: BASE_SIGNAL.to_id,
      signal_type: 'requestVideo',
      value: EXPECTED_VALUE
    } as SignalInfo)

    expect(isSet).toBeTruthy()
  })

  it('register handle offer', () => {
    const BASE_SIGNAL = {
      from_id: 'from_id',
      to_id: 'to_id'
    } as BaseSignal
    const EXPECTED_VALUE = 'SDP'
    let isSet = false

    const rtc_121: One2OneSignalServer = new RTC121('', '', fakeSS, buildPeerConnection())

    rtc_121.setBase(BASE_SIGNAL)
    rtc_121.handleOffer(async (signal) => {
      expect(signal).not.toBeNull()
      expect(signal.signal_type).toBe('offer')
      expect(signal.from_id).toBe(BASE_SIGNAL.from_id)
      expect(signal.to_id).toBe(BASE_SIGNAL.to_id)
      expect(signal.value).toBe(EXPECTED_VALUE)
      isSet = true
      return false
    })

    emit(fakeSS, {
      from_id: BASE_SIGNAL.from_id,
      to_id: BASE_SIGNAL.to_id,
      signal_type: 'offer',
      value: EXPECTED_VALUE
    } as SignalInfo)

    expect(isSet).toBeTruthy()
  })
})

let buildPeerConnection = vi.fn(() => {
  return {} as RTCPeerConnection
})

const FakeSS = vi.fn()

FakeSS.mockImplementation(() => ({
  events: new Map(),

  registerEvent(type: SignalType, handler: (si: SignalInfo) => void): void {
    this.events.set(type, handler)
  },
  sendSignalDeny(_from_id: string, _to_id: string) {},

  emit(si: SignalInfo) {
    const ev = this.events.get(si.signal_type)
    if (ev === null) {
      throw 'ev undefined'
    }

    ev(si)
  }
}))

function emit(ss: any, si: SignalInfo) {
  ss.emit(si)
}
