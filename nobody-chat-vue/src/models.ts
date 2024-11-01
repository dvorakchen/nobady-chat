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

export type SignalInfo = {
  from_id: string
  to_id: string
  signal_type: SignalType
  value: string
}

export type SignalType =
  | 'offer' /*  send a RTC offer */
  | 'answer' /*  send a RTC answer */
  | 'newCandidate' /*  send a new candidate */
  | 'requestVideo' /* send a request video communication */
  | 'deny' /* send deny to deny opposite peer's request */
