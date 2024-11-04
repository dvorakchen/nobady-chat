import type { SignalInfo } from '@/models'

export interface One2OneSignalServer {
  localVideo: Selector
  remoteVideo: Selector

  setBase(base: BaseSignal): void

  sendRequest(): void

  sendDeny(): void

  registerBeforeRequest(handler: Handler): void

  registerBeforeOffer(handler: Handler): void

  registerBeforeAnswer(handler: Handler): void

  registerBeforeDeny(handler: Handler): void

  stop(): void
}

export type BaseSignal = {
  from_id: string
  to_id: string
}

export type BaseSdp = {
  sdp: RTCSessionDescription
}

export type Handler = (signal: SignalInfo) => Promise<boolean>

export type Selector = string
