/// NetSocket
/// Wrapped WebSocket

import type { RecvMsg, User } from '@/models'
import type { SignalInfo } from '@/rtc'

export class NetSocket {
  private receivedEvent: Map<string, Event> = new Map()
  private socket: WebSocket
  private inited = false

  constructor() {
    this.socket = newConnection()

    this.socket.onmessage = (ev) => {
      const data: NetSocketRecvData = JSON.parse(ev.data)
      this.distributeReceEvent(data)
    }

    this.socket.onopen = () => {
      this.inited = true
    }
  }

  public async registerReceivedEvent(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    event: Event
  ) {
    if (!this.inited) {
      return new Promise((resolve, reject) => {
        const handleOnOpen = () => {
          this.receivedEvent.set(msgType, event)
          this.socket.removeEventListener('open', handleOnOpen)

          resolve(void 0)
        }

        const handleOnError = (ev: any) => {
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
      resolve(void 0)
    })
  }

  private distributeReceEvent(data: NetSocketRecvData) {
    if (data.msg_type === undefined) {
      return
    }

    let keys = Object.keys(data.msg_type)
    if (keys.length !== 1) {
      throw "Type error: msg_type's key count shoud be one"
    }

    const entry = this.receivedEvent.get(keys[0])

    entry?.(data.msg_type)
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
