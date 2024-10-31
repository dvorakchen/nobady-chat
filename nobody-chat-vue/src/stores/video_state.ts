import { User, type SignalInfo } from '@/models'
import type { NetSocketDataType, RegisterEventable, Signal } from '@/net/netsocket'
import { defineStore } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { useChatState } from './chat_state'
import { useNetSocket } from './socket_state'
import { Alert, Notification, useMsgState } from './message_state'
import { getMediaStreamPermission } from '@/utils'

export const useVideoState = defineStore('videoState', () => {
  let to = ref(null as null | User)
  let state: VideoState = 'free' as VideoState
  let localVideoRef: null | HTMLVideoElement = null
  let remoteVideoRef: null | HTMLVideoElement = null
  let temporarySignal: null | SignalInfo = null
  let localStream: null | MediaStream = null
  let remoteStream: null | MediaStream = null
  const peerConnection = buildPeerConnection()

  configPeer()

  function configPeer() {
    peerConnection.onnegotiationneeded = async (ev) => {
      if (to.value === null) {
        return
      }
      await peerConnection.setLocalDescription()
      const sdp = peerConnection.localDescription

      const socket = useNetSocket()
      const chatState = useChatState()
      socket.sendSignalOffer(chatState.user.id, to.value!.id, JSON.stringify(sdp))
      console.log('send reoffer')
    }

    peerConnection.ontrack = (ev) => {
      const stream = ev.streams[0]
      remoteStream = stream
      remoteVideoRef!.srcObject = stream
    }

    peerConnection.onicecandidate = (ev) => {
      if (to.value === null) {
        return
      }

      const socket = useNetSocket()
      const chatState = useChatState()

      socket.sendSignalCandidate(chatState.user.id, to.value!.id, JSON.stringify(ev.candidate))
    }
  }

  async function sendOffer() {
    const stream = await getMediaStreamPermission()
    if (stream === null) {
      to.value = null
      return
    }

    localStream = stream
    localVideoRef!.srcObject = stream
    for (const track of stream.getTracks()) {
      peerConnection.addTrack(track, stream)
    }

    await peerConnection.setLocalDescription()
    let sdp = peerConnection.localDescription
    const socket = useNetSocket()
    const chatState = useChatState()

    socket.sendSignalOffer(chatState.user.id, to.value!.id, JSON.stringify(sdp))
  }

  async function sendAnswer() {
    state = 'communicating'
    const chatState = useChatState()
    const toUser = new User()
    toUser.id = temporarySignal!.from_id
    toUser.name = chatState.findUsername(toUser.id)
    to.value = toUser

    let sdp = new RTCSessionDescription(JSON.parse(temporarySignal!.value))
    await peerConnection.setRemoteDescription(sdp)

    let stream = await getMediaStreamPermission()

    if (stream === null) {
      const socket = useNetSocket()
      const chatState = useChatState()
      socket.sendSignalDeny(chatState.user.id, temporarySignal!.from_id)
      return
    }
    localStream = stream
    const socket = useNetSocket()

    nextTick(async () => {
      localVideoRef!.srcObject = stream
      for (const track of stream.getTracks()) {
        peerConnection.addTrack(track, stream)
      }

      const localSDP = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(localSDP)

      socket.sendSignalAnswer(
        chatState.user.id,
        temporarySignal!.from_id,
        JSON.stringify(peerConnection.localDescription)
      )
    })
  }

  function askUser() {
    const msgState = useMsgState()
    const chatState = useChatState()
    const socket = useNetSocket()
    const name = chatState.findUsername(temporarySignal?.from_id ?? '')

    msgState.pushAlert(
      new Alert(
        `${name} 请求视频通话`,
        {
          label: '接受',
          func: async (close) => {
            // send answer
            await sendAnswer()
            close()
          }
        },
        {
          label: '拒绝',
          func: (close) => {
            // send deny
            socket.sendSignalDeny(chatState.user.id, temporarySignal!.from_id)
            close()
          }
        }
      )
    )
  }

  const isShowScreen = computed(() => {
    return to.value !== null
  })

  const isShowConnecting = computed(() => {
    return state !== 'communicating'
  })

  function bindSocket(register: RegisterEventable) {
    register.registerEvent('signal', handleSignal)
  }

  async function handleSignal(data: NetSocketDataType) {
    data = data as Signal

    const chatState = useChatState()

    const signal = data.signal
    if (
      signal.to_id !== chatState.user.id ||
      (to.value !== null && signal.from_id !== to.value!.id)
    ) {
      return
    }

    switch (signal.signal_type) {
      case 'offer':
        await handleOffer(signal)
        break
      case 'deny':
        await handleDeny()
        break
      case 'answer':
        await handleAnswer(signal)
        break
      case 'newCandidate':
        await handleNewCandidate(signal)
        break
    }
  }

  async function handleOffer(signalInfo: SignalInfo) {
    const socket = useNetSocket()
    if (state === 'free') {
      temporarySignal = signalInfo
      //  ask user
      askUser()
    } else if (state === 'communicating') {
      //  reoffer
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(signalInfo.value))
      )
    } else {
      // apply deny
      socket.sendSignalDeny(signalInfo.from_id, signalInfo.to_id)
    }
  }

  async function handleDeny() {
    const msgState = useMsgState()
    msgState.pushNotification(new Notification('对方拒绝了你的视频通话'))
    await peerConnection.setLocalDescription({ type: 'rollback' })
    hangUp()
  }

  async function handleAnswer(signalInfo: SignalInfo) {
    let sdp = JSON.parse(signalInfo.value)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
    state = 'communicating'
  }

  async function handleNewCandidate(signalInfo: SignalInfo) {
    if (peerConnection.remoteDescription === null) {
      return
    }

    const value = JSON.parse(signalInfo.value)
    if (value === null || value.sdpMid === null || value.sdpMLineIndex === null) {
      return
    }
    const candidate = new RTCIceCandidate(value)
    if (candidate.sdpMid === null || candidate.sdpMLineIndex === null) {
      return
    }

    await peerConnection.addIceCandidate(candidate)
  }

  function setVideoElements(local: HTMLVideoElement | null, remote: HTMLVideoElement | null) {
    localVideoRef = local
    remoteVideoRef = remote
  }

  function hangUp() {
    to.value = null
    state = 'free'
    if (localStream !== null) {
      for (const track of localStream.getTracks()) {
        track.stop()
      }
    }
    if (remoteStream !== null) {
      for (const track of remoteStream.getTracks()) {
        track.stop()
      }
    }
    if (localVideoRef !== null) {
      localVideoRef.srcObject = null
      localVideoRef = null
    }
    if (remoteVideoRef !== null) {
      remoteVideoRef.srcObject = null
      remoteVideoRef = null
    }
    temporarySignal = null
  }

  return {
    to,
    state,
    isShowConnecting,
    isShowScreen,
    bindSocket,
    setVideoElements,
    hangUp,
    sendOffer
  }
})

export type VideoState =
  | 'free' /* nothing doing */
  | 'thinking' /* received a requesting, and wait for user handling, accept or deny */
  | 'offering' /* negotiating */
  | 'waitOffering' /* applied a request, wait for onswer of opposite */
  | 'communicating' /* connection successful, communicating */

export function buildPeerConnection(): RTCPeerConnection {
  const config = peerConfig()

  const peerConnection = new RTCPeerConnection(config)

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
