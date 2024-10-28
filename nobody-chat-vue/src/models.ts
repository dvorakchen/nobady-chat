export type OnlineUser = {
  id: string
  name: string
  unread: number
}

export type User = {
  id: string
  name: string
}

export type RecvMsg = {
  from: string
  msg: string
}
