import type { User } from './models'
import type { SignalInfo } from './rtc'

const ADDR = import.meta.env.VITE_API_ADDRESS

export function newConnection(): WebSocket {
  let protocol = 'ws'
  let path = '/ws'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  protocol += location.protocol === 'https:' ? 's' : ''

  const socket = new WebSocket(`${protocol}://${ADDR}${path}`)

  socket.onopen = () => {}

  socket.onerror = (ev) => {
    console.error(ev)
  }

  return socket
}

export async function getOnlineUsers(): Promise<User[]> {
  let path = '/api/allonlineusers'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  let resp = await fetch(`${location.protocol}//${ADDR}${path}`)
  let data: User[] = await resp.json()

  return data
}

export class OnlineUserModel {
  id: string = ''
  name: string = ''
  unread: number = 0
}

export class WebSocketData {
  public msg_type: WebSocketDataType = {} as WebSocketDataType

  static newRequestVideo(from_id: string, to_id: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'requestVideo',
          value: new Date().getTime() + ''
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newCanAccept(from_id: string, to_id: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'canAccept',
          value: ''
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newBusying(from_id: string, to_id: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'busying',
          value: ''
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newRequestedFirst(from_id: string, to_id: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'requestedFirst',
          value: ''
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newOffer(from_id: string, to_id: string, sdp: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'offer',
          value: sdp
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newAnswer(from_id: string, to_id: string, sdp: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'answer',
          value: sdp
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newDeny(from_id: string, to_id: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'deny',
          value: ''
        } as SignalInfo
      } as WebSocketDataType
    }
  }

  static newNewCandidate(from_id: string, to_id: string, candidate: string): WebSocketData {
    return {
      msg_type: {
        signal: {
          from_id,
          to_id,
          signal_type: 'newCandidate',
          value: candidate
        } as SignalInfo
      } as WebSocketDataType
    }
  }
}

export type WebSocketDataType = {
  setUser: OnlineUserModel
  userOnline: OnlineUserModel
  msg: {
    from: string
    msg: string
  }
  userOffline: OnlineUserModel
  signal: SignalInfo
}
