import { getMediaStreamPermission } from '@/utils'
import type { BaseSdp, BaseSignal, Handler, One2OneSignalServer, Selector } from './one2one'
import { NormalSS, type SignalingServer } from './signaling_server'

export class RTC121 implements One2OneSignalServer {
  localVideo: Selector
  remoteVideo: Selector
  private pc: RTCPeerConnection
  private ss: SignalingServer

  private base: BaseSignal | null = null

  private requestHandler: Handler | null = null
  private offerHandler: Handler | null = null
  private answerHandler: Handler | null = null
  private denyHandler: Handler | null = null

  constructor(
    localVideo: Selector,
    remoteVideo: Selector,
    ss: SignalingServer = new NormalSS(),
    pc: RTCPeerConnection = buildPeerConnection()
  ) {
    this.localVideo = localVideo
    this.remoteVideo = remoteVideo
    this.ss = ss
    this.pc = pc
    this.configPC()
    this.registerHandler()
  }

  private get localVideoElement(): HTMLVideoElement | null {
    return document.getElementById(this.localVideo) as HTMLVideoElement | null
  }

  private get remoteVideoElement(): HTMLVideoElement | null {
    return document.getElementById(this.remoteVideo) as HTMLVideoElement | null
  }

  private configPC() {
    this.pc.onicecandidate = (ev) => {
      if (!ev.candidate) {
        return
      }

      this.ss.sendSignalCandidate(
        this.base!.from_id,
        this.base!.to_id,
        JSON.stringify(ev.candidate)
      )
    }

    this.pc.onnegotiationneeded = async () => {
      await this.sendOffer()
    }
  }

  private registerHandler() {
    this.ss.registerEvent('requestVideo', (si) => this.requestHandler?.(si))
    this.ss.registerEvent('offer', (si) => this.offerHandler?.(si))
    this.ss.registerEvent('answer', (si) => this.answerHandler?.(si))
    this.ss.registerEvent('deny', (si) => this.denyHandler?.(si))
    this.ss.registerEvent('newCandidate', (si) => {
      const candidate = JSON.parse(si.value)
      ;(async () => {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
      })()
    })
  }

  setBase(base: BaseSignal): void {
    this.base = base
  }

  sendRequest(): void {
    this.ss.sendSignalRequest(this.base!.from_id, this.base!.to_id)
  }
  async sendOffer(): Promise<void> {
    const stream = await getMediaStreamPermission()
    if (stream === null || this.localVideoElement === null) {
      this.sendDeny()
      return
    }

    this.localVideoElement.srcObject = stream

    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream))
    await this.pc.setLocalDescription()
    const sdp = this.pc.localDescription

    this.ss.sendSignalOffer(this.base!.from_id, this.base!.to_id, JSON.stringify(sdp))
  }

  async sendAnswer(base: BaseSdp): Promise<void> {
    const stream = await getMediaStreamPermission()
    if (stream === null || this.remoteVideoElement === null) {
      this.sendDeny()
      return
    }

    this.remoteVideoElement.srcObject = stream
    await this.pc.setRemoteDescription(new RTCSessionDescription(base.sdp))

    await this.pc.setLocalDescription()
    const sdp = this.pc.localDescription

    this.ss.sendSignalAnswer(this.base!.from_id, this.base!.to_id, JSON.stringify(sdp))
  }

  sendDeny(): void {
    this.ss.sendSignalDeny(this.base!.from_id, this.base!.to_id)
  }

  handleRequest(handler: Handler): void {
    this.requestHandler = handler
  }
  handleOffer(handler: Handler): void {
    this.offerHandler = handler
  }
  handleAnswer(handler: Handler): void {
    this.answerHandler = handler
  }
  handleDeny(handler: Handler): void {
    this.denyHandler = (_handler) => {
      handler(_handler)
      if (this.localVideoElement !== null) {
        const stream = this.localVideoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
      if (this.remoteVideoElement !== null) {
        const stream = this.remoteVideoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }
}

export function buildPeerConnection(): RTCPeerConnection {
  const config = peerConfig()

  const peerConnection = new RTCPeerConnection(config)

  return peerConnection
}

function peerConfig(): RTCConfiguration {
  const config = {
    iceServers: [
      {
        urls: [import.meta.env.VITE_TURN_URL],
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
      }
    ]
  }

  return config
}
