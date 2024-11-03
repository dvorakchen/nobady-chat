import { getMediaStreamPermission } from '@/utils'
import type { BaseSdp, BaseSignal, Handler, One2OneSignalServer, Selector } from './one2one'
import { NormalSS, type SignalingServer } from './signaling_server'

export class RTC121 implements One2OneSignalServer {
  localVideo: Selector
  remoteVideo: Selector
  private pc: RTCPeerConnection
  private ss: SignalingServer

  private base: BaseSignal | null = null

  private requestHandler: Handler = async () => true
  private offerHandler: Handler = async () => true
  private answerHandler: Handler = async () => true
  private denyHandler: Handler = async () => true

  private iceCandidateBuffer: RTCIceCandidate[] = []

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

      console.log('new candidate')
      this.ss.sendSignalCandidate(
        this.base!.from_id,
        this.base!.to_id,
        JSON.stringify(ev.candidate)
      )
    }

    this.pc.onnegotiationneeded = async () => {
      console.log('onnegotiation')
      await this.sendOffer()
    }

    this.pc.ontrack = (ev) => {
      this.remoteVideoElement!.srcObject = ev.streams[0]
    }
  }

  private cleanICECandidateBuffer() {
    // if (this.pc.remoteDescription) {
    //   console.log('clear')
    //   this.iceCandidateBuffer.forEach((c) => {
    //     this.pc.addIceCandidate(c)
    //   })
    // }
  }

  private registerHandler() {
    this.ss.registerEvent('requestVideo', async (si) => {
      if (!(await this.requestHandler(si))) {
        return
      }

      // received request and allowed
      // apply a offer
      await this.sendOffer()
    })
    this.ss.registerEvent('offer', async (si) => {
      if (!(await this.offerHandler(si))) {
        return
      }
      console.warn('handle offer')
      const sdp = new RTCSessionDescription(JSON.parse(si.value))
      console.warn('prepare sendAnswer')
      await this.sendAnswer({ sdp })
    })
    this.ss.registerEvent('answer', async (si) => {
      if (!(await this.answerHandler(si))) {
        return
      }

      const sdp = JSON.parse(si.value)
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })
    this.ss.registerEvent('deny', async (si) => {
      if (!(await this.denyHandler(si))) {
        return
      }
    })
    this.ss.registerEvent('newCandidate', async (si) => {
      const candidate = new RTCIceCandidate(JSON.parse(si.value))
      console.log('add candidate')
      // if (this.pc.remoteDescription) {
      // if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(candidate)
      // }
      //   this.iceCandidateBuffer.forEach((c) => {
      //     this.pc.addIceCandidate(c)
      //   })
      // } else {
      //   this.iceCandidateBuffer.push(candidate)
      // }
    })
  }

  setBase(base: BaseSignal): void {
    this.base = base
  }

  async sendRequest(): Promise<void> {
    console.log('send request')
    await getMediaStreamPermission()
    this.ss.sendSignalRequest(this.base!.from_id, this.base!.to_id)
  }
  async sendOffer(): Promise<void> {
    console.log('send offer')
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
    console.warn('in sendAnswer')
    const stream = await getMediaStreamPermission()
    if (stream === null || this.localVideoElement === null) {
      this.sendDeny()
      return
    }

    console.warn('after get stream')
    this.localVideoElement.srcObject = stream
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream))
    await this.pc.setRemoteDescription(base.sdp)
    console.warn('remoteDesc')

    let sdp = await this.pc.createAnswer()
    await this.pc.setLocalDescription(sdp)

    this.cleanICECandidateBuffer()
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
    this.denyHandler = async (_handler) => {
      handler(_handler)
      if (this.localVideoElement && this.localVideoElement.srcObject) {
        const stream = this.localVideoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
      if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
        const stream = this.remoteVideoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
      return true
    }
  }
  async stop(): Promise<void> {
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      const stream = this.localVideoElement.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      this.localVideoElement.srcObject = null
    }
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      const stream = this.remoteVideoElement.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      this.remoteVideoElement.srcObject = null
    }

    this.sendDeny()
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
