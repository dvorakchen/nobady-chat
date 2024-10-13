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

export async function getOnlineUsers(): Promise<OnlineUserModel[]> {
  let path = '/api/allonlineusers'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  let resp = await fetch(`${location.protocol}//${ADDR}${path}`)
  let data: [OnlineUserModel] = await resp.json()

  return data
}

export class OnlineUserModel {
  id: string = ''
  name: string = ''
  unread: number = 0
}

export type WsRecvData = {
  msg_type: {
    setUser: OnlineUserModel
    userOnline: OnlineUserModel
    msg: {
      from: string
      msg: string
    }
    userOffline: OnlineUserModel
  }
}
