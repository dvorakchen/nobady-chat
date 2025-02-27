/// NetSocket
/// Wrapped WebSocket

import type { RecvMsg, SignalInfo, User } from '@/models'
import {
  ChaChaBuilder,
  DHSecretExchange,
  type Cipher,
  type CipherBuilder,
  type SecretExchange
} from './cipher'
import { ArrayTobase64, base64ToArrayBuffer } from '@/utils'

export interface RegisterSocketEventable {
  registerEvent(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    event: Event
  ): Promise<void>
}

export interface SocketSendable {
  send(data: string): void
}

export class NetSocket implements RegisterSocketEventable, SocketSendable {
  private receivedEvent: Map<string, Event> = new Map()
  private socket: WebSocket
  private inited = false
  private cipher: Cipher | null = null

  constructor(
    socket: WebSocket = newConnection(),
    private cipherBuilder: CipherBuilder = new ChaChaBuilder(),
    private exchange: SecretExchange = new DHSecretExchange()
  ) {
    this.socket = socket

    this.socket.onmessage = null

    this.socket.onopen = () => {
      this.exchangeSercet()
      this.inited = true
    }
  }

  public send(data: string) {
    let cipher_bytes = this.cipher!.encrypt(data)
    let cipher_text = ArrayTobase64(cipher_bytes)
    this.socket.send(cipher_text)
  }

  public registerEvent(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    event: Event
  ): Promise<void> {
    if (!this.inited) {
      return new Promise((resolve, reject) => {
        const handleOnOpen = () => {
          this.receivedEvent.set(msgType, event)
          this.socket.removeEventListener('open', handleOnOpen)

          resolve()
        }

        const handleOnError = (_ev: any) => {
          this.socket.removeEventListener('error', handleOnError)
          reject(`register NetSocket Event failure`)
        }

        this.socket.addEventListener('open', handleOnOpen)
        this.socket.addEventListener('error', handleOnError)
      })
    } else {
      this.receivedEvent.set(msgType, event)
    }

    return new Promise((resolve) => {
      resolve()
    })
  }

  private async exchangeSercet() {
    let secret = await this.exchange.exchange(this.socket)
    this.cipher = this.cipherBuilder.build(secret)
    this.socket.onmessage = this.readyOnMessage
  }

  private readyOnMessage = (ev: MessageEvent<any>) => {
    let cipher_text = base64ToArrayBuffer(ev.data)
    const decrypted = this.cipher!.decrypt(cipher_text)
    const data: NetSocketRecvData = JSON.parse(decrypted)
    console.log('onmessage: ', Object.keys(data.msg_type)[0], ' start')
    this.distributeReceEvent(data)
    console.log('onmessage: ', Object.keys(data.msg_type)[0], ' end')
  }

  private distributeReceEvent(data: NetSocketRecvData) {
    if (data.msg_type === undefined) {
      return
    }

    const keys = Object.keys(data.msg_type)
    if (keys.length !== 1) {
      throw "Type error: msg_type's key count shoud be one"
    }
    const entry = this.receivedEvent.get(keys[0])
    if (entry !== undefined) {
      console.log('distribute start: ', keys[0], ' -- ', (data.msg_type as any).signal?.signal_type)
      entry(data.msg_type)
      console.log('distribute end: ', keys[0], ' -- ', (data.msg_type as any).signal?.signal_type)
    }
  }
}

type Event = (entry: NetSocketDataType) => void

const ADDR = import.meta.env.VITE_API_ADDRESS

export function newConnection(): WebSocket {
  let protocol = 'ws'
  let path = '/ws'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  protocol += location.protocol === 'https:' ? 's' : ''

  const url = `${protocol}://${ADDR}${path}`
  const socket = new WebSocket(url)

  socket.onerror = (ev) => {
    console.error('WebSocket Error: ', ev)
  }

  return socket
}

export class NetSocketRecvData {
  public msg_type: NetSocketDataType = {} as NetSocketDataType

  public static newSetUser(user: User): NetSocketRecvData {
    const res = new NetSocketRecvData()
    res.msg_type = {
      setUser: user
    } as SetUser

    return res
  }

  public static newUserOnline(user: User): NetSocketRecvData {
    const res = new NetSocketRecvData()
    res.msg_type = {
      userOnline: user
    } as UserOnline

    return res
  }

  public static newMsg(msg: RecvMsg): NetSocketRecvData {
    const res = new NetSocketRecvData()
    res.msg_type = {
      msg
    } as Msg

    return res
  }

  public static newUserOffline(user: User): NetSocketRecvData {
    const res = new NetSocketRecvData()
    res.msg_type = {
      userOffline: user
    } as UserOffline

    return res
  }

  public static newSignal(signalInfo: SignalInfo): NetSocketRecvData {
    const res = new NetSocketRecvData()
    res.msg_type = {
      signal: signalInfo
    } as Signal

    return res
  }
}

export type NetSocketDataType = SetUser | UserOnline | Msg | UserOffline | Signal

export type SetUser = {
  setUser: User
}

export type UserOnline = {
  userOnline: User
}

export type Msg = {
  msg: RecvMsg
}

export type UserOffline = {
  userOffline: User
}

export type Signal = {
  signal: SignalInfo
}

export class NetSocketSendData {
  public msg_type: NetSocketSendDataType = {} as NetSocketSendDataType

  public static newTalkTo(to: string, msg: string): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      talkTo: {
        to,
        msg
      }
    } as TalkTo

    return res
  }

  public static newSignalRequest(
    from_id: string,
    to_id: string,
    timestamp: number
  ): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'requestVideo',
        value: timestamp + ''
      }
    } as Signal

    return res
  }

  public static newSignalDeny(from_id: string, to_id: string): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'deny',
        value: ''
      }
    } as Signal

    return res
  }

  public static newSignalOffer(from_id: string, to_id: string, sdp: string): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'offer',
        value: sdp
      }
    } as Signal

    return res
  }

  public static newSignalAnswer(from_id: string, to_id: string, sdp: string): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'answer',
        value: sdp
      }
    } as Signal

    return res
  }

  public static newSignalStop(from_id: string, to_id: string): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'stop',
        value: ''
      }
    } as Signal

    return res
  }

  public static newSignalCandidate(
    from_id: string,
    to_id: string,
    candidate: string
  ): NetSocketSendData {
    const res = new NetSocketSendData()
    res.msg_type = {
      signal: {
        from_id,
        to_id,
        signal_type: 'newCandidate',
        value: candidate
      }
    } as Signal

    return res
  }
}

export type NetSocketSendDataType = TalkTo | Signal

export type TalkTo = {
  talkTo: {
    to: string
    msg: string
  }
}
