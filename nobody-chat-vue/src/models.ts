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
  | 'canAccept' /* request could be accept */
  | 'requestVideo' /* send a request video communication */
  | 'busying' /* send I am busying */
  | 'requestedFirst' /* send I have be requesting you first */
  | 'deny' /* send deny to deny opposite peer's request */
