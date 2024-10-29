import { WebSocketData } from './http'
import { useChatState } from './stores/chat_state'
import { usePeerState } from './stores/peer_state'

export function buildPeerConnection(): RTCPeerConnection {
  const config = peerConfig()

  const peerConnection = new RTCPeerConnection(config)

  peerConnection.onnegotiationneeded = (ev) => {}

  peerConnection.onicecandidate = (ev) => {
    let peerState = usePeerState()
    let chatState = useChatState()

    let data = WebSocketData.newNewCandidate(
      chatState.user.id,
      peerState.oppositeId,
      JSON.stringify(ev.candidate)
    )

    // chatState.socket.send(JSON.stringify(data))
  }

  peerConnection.ontrack = (ev) => {
    let peerState = usePeerState()
    peerState.removeVideoRef!.srcObject = ev.streams[0]
  }

  return peerConnection
}

function peerConfig(): RTCConfiguration {
  const config = {
    iceServers: [
      {
        urls: [import.meta.env.VITE_TURN_URL],
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
      }
    ]
  }

  return config
}

/// handle if reveived data that request video
export async function handleRecvSignal(signal: SignalInfo) {
  switch (signal.signal_type) {
    case 'requestVideo':
      handleRecvRequesting(signal)
      break
    case 'canAccept':
      await handleRecvCanAccept(signal)
      break
    case 'deny':
      handleRecvDeny(signal)
      break
    case 'offer':
      await handleRecvOffer(signal)
      break
    case 'answer':
      await handleRecvAnswer(signal)
      break
    case 'newCandidate':
      await handleRecvNewCandidate(signal)
      break
    default:
      break
  }
}

/**
 * received requesting, indicating has peer requesting for video communication
 */
function handleRecvRequesting(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (
    peerState.state === 'requesting' &&
    peerState.oppositeId === signal.from_id &&
    !isNaN(parseInt(signal.value))
  ) {
    if (peerState.requestTimeStamp <= +signal.value) {
      const data = WebSocketData.newRequestedFirst(chatState.user.id, peerState.oppositeId)
      // chatState.socket.send(JSON.stringify(data))
    } else {
      peerState.state = 'spare'
    }
  } else if (peerState.isUsing) {
    const data = WebSocketData.newBusying(chatState.user.id, peerState.oppositeId)
    // chatState.socket.send(JSON.stringify(data))
  }

  if (peerState.state === 'spare') {
    peerState.setThinking(signal)
  }
}

/**
 * received canAccept, indicating opposite peer allowed this peer's requesting.
 *
 * ready for send SDP for establish RTCPeerConnection
 */
async function handleRecvCanAccept(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (peerState.state !== 'requesting') {
    return
  }

  if (chatState.user.id !== signal.to_id || peerState.oppositeId !== signal.from_id) {
    return
  }

  peerState.state = 'offering'

  //  establish RTCPeerConnection
  const stream = await displayOwnVideo(peerState.videoRef!)

  for (const track of stream.getTracks()) {
    peerState.peerConnection.addTrack(track, stream)
  }

  await peerState.peerConnection.setLocalDescription()

  //  negotiating SDP
  let data = WebSocketData.newOffer(
    chatState.user.id,
    peerState.oppositeId,
    JSON.stringify(peerState.peerConnection.localDescription)
  )

  // chatState.socket.send(JSON.stringify(data))
}

async function handleRecvOffer(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (
    peerState.state !== 'waitOffering' ||
    chatState.user.id !== signal.to_id ||
    peerState.oppositeId !== signal.from_id ||
    peerState.videoRef === null
  ) {
    return
  }

  if (peerState.peerConnection.signalingState !== 'stable') {
    const data = WebSocketData.newBusying(chatState.user.id, peerState.oppositeId)
    // chatState.socket.send(JSON.stringify(data))
    return
  }

  const stream = await displayOwnVideo(peerState.videoRef!)
  peerState.videoRef.srcObject = stream

  for (const track of stream.getTracks()) {
    peerState.peerConnection.addTrack(track, stream)
  }

  let remoteSDP = JSON.parse(signal.value)
  remoteSDP = new RTCSessionDescription(remoteSDP)
  await peerState.peerConnection.setRemoteDescription(remoteSDP)

  await peerState.peerConnection.setLocalDescription()
  const localSDP = peerState.peerConnection.localDescription

  let data = WebSocketData.newAnswer(
    chatState.user.id,
    peerState.oppositeId,
    JSON.stringify(localSDP)
  )

  // chatState.socket.send(JSON.stringify(data))
}

async function handleRecvAnswer(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (
    peerState.state !== 'offering' ||
    chatState.user.id !== signal.to_id ||
    peerState.oppositeId !== signal.from_id
  ) {
    return
  }

  let remoteSDP = JSON.parse(signal.value)
  remoteSDP = new RTCSessionDescription(remoteSDP)

  await peerState.peerConnection.setRemoteDescription(remoteSDP)
}

async function handleRecvNewCandidate(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (chatState.user.id !== signal.to_id || peerState.oppositeId !== signal.from_id) {
    return
  }

  let candidate = JSON.parse(signal.value)
  candidate = new RTCIceCandidate(candidate)
  await peerState.peerConnection.addIceCandidate(candidate)
}

function handleRecvDeny(signal: SignalInfo) {
  let peerState = usePeerState()
  let chatState = useChatState()

  if (
    chatState.user.id !== signal.to_id ||
    peerState.oppositeId !== signal.from_id ||
    peerState.state !== 'requesting'
  ) {
    return
  }

  peerState.state = 'spare'
  peerState.oppositeId = ''
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

/**
 * get the user media, attach at video element
 * @param video host video element
 * @returns video stream
 */
export async function displayOwnVideo(video: HTMLVideoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  video.autoplay = true
  video.muted = false
  video.srcObject = stream

  return stream
}
