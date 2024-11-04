import type { BaseSignal, Handler, One2OneSignalServer } from './one2one'
import { NormalSS, type SignalingServer } from './signaling_server'
import { getMediaStreamPermission } from '@/utils'
import type { SignalInfo } from '@/models'

export class RTC121 implements One2OneSignalServer {
  private base: BaseSignal | null = null
  private requestHandler = async (_si: SignalInfo) => true
  private offerHandler = async (_si: SignalInfo) => true
  private answerHandler = async (_si: SignalInfo) => true
  private denyHandler = async (_si: SignalInfo) => true
  private pc: RTCPeerConnection | null = null

  constructor(
    public localVideo: string,
    public remoteVideo: string,
    private ss: SignalingServer = new NormalSS()
  ) {
    this.ss.registerEvent('requestVideo', async (si) => {
      if (!(await this.requestHandler(si))) {
        console.log('recv request and reject: ', si)
        return
      }

      console.log('recv request: ', si)
      this.prepareOffer()
    })

    this.ss.registerEvent('offer', async (si) => {
      if (!(await this.offerHandler(si))) {
        return
      }

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
      if (!(await this.answerHandler(si))) {
        return
      }
      console.log('recv answer')
      const sdp = new RTCSessionDescription(JSON.parse(si.value))
      this.pc!.setRemoteDescription(sdp)
    })

    ss.registerEvent('deny', async (si) => {
      if (!(await this.denyHandler(si))) {
        return
      }
    })

    this.ss.registerEvent('newCandidate', async (si) => {
      console.log('recv newCandidate')
      const can = new RTCIceCandidate(JSON.parse(si.value))
      this.pc!.addIceCandidate(can)
    })

    ss.registerEvent('stop', async (_si) => {
      console.log('stop')
      this.stop()
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

  private async prepareOffer() {
    if (this.pc) {
      console.error('pc exist')
      return
    }
    console.log('prepare offer')
    this.pc = this.createPeerConnection()
    const stream = await getMediaStreamPermission()
    this.localVideoElement!.srcObject = stream

    stream!.getTracks().forEach((t) => this.pc!.addTrack(t, stream!))
  }

  private async sendAnswer(sdp: RTCSessionDescription) {
    this.ss.sendSignalAnswer(this.base!.from_id, this.base!.to_id, JSON.stringify(sdp))
  }

  setBase(base: BaseSignal): void {
    this.base = base
  }
  async sendRequest() {
    this.ss.sendSignalRequest(this.base!.from_id, this.base!.to_id)
  }
  sendDeny(): void {
    this.ss.sendSignalDeny(this.base!.from_id, this.base!.to_id)
  }
  registerBeforeRequest(handler: Handler): void {
    this.requestHandler = handler
  }
  registerBeforeOffer(handler: Handler): void {
    this.offerHandler = handler
  }
  registerBeforeAnswer(handler: Handler): void {
    this.answerHandler = handler
  }
  registerBeforeDeny(handler: Handler): void {
    this.denyHandler = handler
  }
  stop(): void {
    if (this.pc) {
      this.ss.sendSignalStop(this.base!.from_id, this.base!.to_id)
    }

    if (this.localVideoElement && this.localVideoElement.srcObject) {
      ;(this.localVideoElement.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      this.localVideoElement.srcObject = null
    }
    if (this.remoteVideoElement && this.remoteVideoElement.srcObject) {
      ;(this.remoteVideoElement.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      this.remoteVideoElement.srcObject = null
    }

    if (this.pc) {
      this.pc.onicecandidate = null
      this.pc.onnegotiationneeded = null
      this.pc.ontrack = null

      this.pc.close()
      this.pc = null
    }

    this.base = null
  }
}
