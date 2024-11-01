import { describe, expect, it, vi } from 'vitest'
import type { SignalingServer } from './signaling_server'
import type { SignalType, SignalInfo } from '@/models'
import { RTC121 } from './rtc_121'

vi.stubGlobal(
  'RTCPeerConnection',
  vi.fn(() => ({}))
)

describe('test rtc_121', () => {
  const fakeSS = new FakeSS()

  it('init', () => {
    const rtc_121 = new RTC121('', '', fakeSS, buildPeerConnection())

    expect(rtc_121.localVideo).toBe('')
    expect(rtc_121.remoteVideo).toBe('')
  })
})

function buildPeerConnection(): RTCPeerConnection {
  return {} as RTCPeerConnection
}

class FakeSS implements SignalingServer {
  registerEvent(type: SignalType, handler: (si: SignalInfo) => void): void {}
  sendSignalDeny(from_id: string, to_id: string): void {}
  sendSignalOffer(from_id: string, to_id: string, sdp: string): void {}
  sendSignalAnswer(from_id: string, to_id: string, sdp: string): void {}
  sendSignalCandidate(from_id: string, to_id: string, candidate: string): void {}
  sendSignalRequest(from_id: string, to_id: string): void {}
}
