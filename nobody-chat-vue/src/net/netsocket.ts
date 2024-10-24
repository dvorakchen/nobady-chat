import type { OnlineUserModel } from '@/http'
import type { SignalInfo } from '@/rtc'

export class NetSocket {
  private receivedEvent: Map<string, Event> = new Map()
  private socket: WebSocket

  constructor() {
    this.socket = newConnection()

    this.socket.onmessage = (ev) => {
      const data: NetSocketRecvData = JSON.parse(ev.data)
      this.distributeReceEvent(data)
    }
  }

  public registerReceivedEvent(msgType: string, event: Event) {
    this.receivedEvent.set(msgType, event)
  }

  private distributeReceEvent(data: NetSocketRecvData) {
    let keys = Object.keys(data.msg_type)
    keys.forEach((key) => {
      let entry = (data.msg_type as any)[key]
      this.receivedEvent.get(key)?.(entry)
    })
  }
}

type Event = (entry: any) => {}

const ADDR = import.meta.env.VITE_API_ADDRESS

export function newConnection(): WebSocket {
  let protocol = 'ws'
  let path = '/ws'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  protocol += location.protocol === 'https:' ? 's' : ''

  const socket = new WebSocket(`${protocol}://${ADDR}${path}`)

  socket.onerror = (ev) => {
    console.error('WebSocket Error: ', ev)
  }

  return socket
}

export class NetSocketRecvData {
  public msg_type: NetSocketDataType = {} as NetSocketDataType
}

export type NetSocketDataType = {
  setUser: OnlineUserModel
  userOnline: OnlineUserModel
  msg: {
    from: string
    msg: string
  }
  userOffline: OnlineUserModel
  signal: SignalInfo
}
