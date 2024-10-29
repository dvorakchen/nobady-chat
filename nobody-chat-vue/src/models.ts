export type OnlineUser = {
  id: string
  name: string
  unread: number
}

export class User {
  id: string = ''
  name: string = ''
}

export type RecvMsg = {
  from: string
  msg: string
}
