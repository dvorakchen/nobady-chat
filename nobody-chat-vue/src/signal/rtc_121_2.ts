import { newConnection } from '@/net/netsocket'
import type { BaseSignal, Handler, One2OneSignalServer } from './one2one'
import { NormalSS, type SignalingServer } from './signaling_server'
import { getMediaStreamPermission } from '@/utils'

export class RTC121_2 implements One2OneSignalServer {
  private base: BaseSignal | null = null

  private pc: RTCPeerConnection | null = null
  private ss: SignalingServer = new NormalSS()

  constructor(
    public localVideo: string,
    public remoteVideo: string
  ) {
    this.ss.registerEvent('requestVideo', async (si) => {
      console.log('recv request: ', si)
      this.sendOffer()
    })

    this.ss.registerEvent('offer', async (si) => {
      console.log('recv offer')
      if (this.pc) {
        console.error('pc exist')
        return
      }

      this.base = { from_id: si.to_id, to_id: si.from_id }

      this.pc = this.createPeerConnection()
      const sdp = new RTCSessionDescription(JSON.parse(si.value))
      await this.pc.setRemoteDescription(sdp)

      const stream = await getMediaStreamPermission()!

      stream?.getTracks().forEach((t) => this.pc!.addTrack(t, stream))

      this.localVideoElement!.srcObject = stream

      const answer = await this.pc!.createAnswer()

      await this.pc!.setLocalDescription(answer)

      await this.sendAnswer(this.pc!.localDescription!)
    })

    this.ss.registerEvent('answer', async (si) => {
      console.log('recv answer')
      const sdp = new RTCSessionDescription(JSON.parse(si.value))
      this.pc!.setRemoteDescription(sdp)
    })

    this.ss.registerEvent('newCandidate', async (si) => {
      console.log('recv newCandidate')
      const can = new RTCIceCandidate(JSON.parse(si.value))
      this.pc!.addIceCandidate(can)
    })
  }

  private get localVideoElement(): HTMLVideoElement | null {
    return document.getElementById(this.localVideo) as HTMLVideoElement | null
  }
  private get remoteVideoElement(): HTMLVideoElement | null {
    return document.getElementById(this.remoteVideo) as HTMLVideoElement | null
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [import.meta.env.VITE_TURN_URL],
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL
        }
      ]
    })

    pc.onicecandidate = (ev) => {
      console.log('onicecandidate')
      if (ev.candidate) {
        this.ss.sendSignalCandidate(
          this.base!.from_id,
          this.base!.to_id,
          JSON.stringify(ev.candidate)
        )
      }
    }

    pc.onnegotiationneeded = async () => {
      console.log('onnegotiationneed')
      await pc.setLocalDescription()
      const sdp = pc.localDescription
      this.ss.sendSignalOffer(this.base!.from_id, this.base!.to_id, JSON.stringify(sdp))
      console.log('sent offer')
    }

    pc.ontrack = (ev) => {
      console.log('ontrack')
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = ev.streams[0]
      }
    }

    return pc
  }

  private async sendOffer() {
    const stream = await getMediaStreamPermission()
    this.localVideoElement!.srcObject = stream

    stream!.getTracks().forEach((t) => this.pc!.addTrack(t, stream!))

    this.ss.sendSignalOffer(
      this.base!.from_id,
      this.base!.to_id,
      JSON.stringify(this.pc!.localDescription)
    )
  }

  private async sendAnswer(sdp: RTCSessionDescription) {
    this.ss.sendSignalAnswer(this.base!.from_id, this.base!.to_id, JSON.stringify(sdp))
  }

  setBase(base: BaseSignal): void {
    this.base = base
  }
  async sendRequest() {
    if (this.pc) {
      console.error('pc exist')
      return
    }
    this.pc = this.createPeerConnection()
    const stream = await getMediaStreamPermission()
    this.localVideoElement!.srcObject = stream

    stream!.getTracks().forEach((t) => this.pc!.addTrack(t, stream!))

    // this.sendOffer()
  }
  sendDeny(): void {
    // throw new Error('Method not implemented.')
  }
  handleRequest(handler: Handler): void {
    // throw new Error('Method not implemented.')
  }
  handleOffer(handler: Handler): void {
    // throw new Error('Method not implemented.')
  }
  handleAnswer(handler: Handler): void {
    // throw new Error('Method not implemented.')
  }
  handleDeny(handler: Handler): void {
    // throw new Error('Method not implemented.')
  }
  stop(): void {
    // throw new Error('Method not implemented.')
  }
}
