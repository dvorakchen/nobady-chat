import type { SignalInfo, SignalType } from '@/models'
import type { RegisterSocketEventable } from '@/net/netsocket'

export interface One2OneSignalServer {
  localVideo: Selector
  remoteVideo: Selector

  setBase(base: BaseSignal): void

  sendRequest(): void

  sendOffer(): void

  sendAnswer(base: BaseSdp): void

  sendDeny(): void

  handleRequest(handler: Handler): void

  handleOffer(handler: Handler): void

  handleAnswer(handler: Handler): void

  handleDeny(handler: Handler): void
}

export type BaseSignal = {
  from_id: string
  to_id: string
}

export type BaseSdp = {
  sdp: RTCSessionDescription
}

export type Handler = (signal: SignalInfo) => void

export type Selector = string
