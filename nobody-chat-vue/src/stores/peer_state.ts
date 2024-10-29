import { buildPeerConnection, type SignalInfo } from '@/rtc'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useChatState } from './chat_state'
import { WebSocketData } from '@/http'

// request timeout, millesecond
export const REQUEST_TIMEOUT = 30 * 1000

/**
 * spare: nothing doing
 * thinking: received other peer's requesting, waiting response
 * busying: busying, cannot doing anything for other peer as like other peer requesting
 * accept: accepted opposite peer requesting
 * request: requesting oppsite peer
 */
export type PeerState =
  | 'spare'
  | 'requesting'
  | 'thinking'
  | 'busying'
  | 'accept'
  | 'offering'
  | 'waitOffering'

export const usePeerState = defineStore('rtcPeer', {
  state: () => ({
    state: ref<PeerState>('spare'),
    peerConnection: buildPeerConnection(),
    oppositeId: '',
    requestTimeStamp: 0,
    videoRef: null as HTMLVideoElement | null,
    removeVideoRef: null as HTMLVideoElement | null,
    temporarySignal: null as SignalInfo | null
  }),
  getters: {
    isUsing: (state) => state.state !== 'spare',
    isConnection: (state) =>
      ['requesting', 'offering', 'waitOffering'].some((t) => t === state.state),
    isThinking: (state) => state.state === 'thinking',
    oppositeName: (state) => {
      let chatState = useChatState()
      let name = chatState.onlineUsers.find((e) => e.id === state.oppositeId)?.name ?? ''

      return name
    },
    showVideo: (state) => {
      const showVideo = ['accept', 'offering', 'waitOffering'].some((t) => t === state.state)
      return showVideo
    }
  },
  actions: {
    /**
     * deny opposite peer's requesting
     */
    denyRequest() {
      const chatState = useChatState()
      this.state = 'spare'
      let data = WebSocketData.newDeny(chatState.user.id, this.oppositeId)
      // chatState.socket.send(JSON.stringify(data))
    },
    setThinking(signal: SignalInfo) {
      this.temporarySignal = signal
      this.oppositeId = signal.from_id
      this.state = 'thinking'
    },
    async acceptRequest() {
      if (this.temporarySignal !== null) {
        this.state = 'waitOffering'
        const chatState = useChatState()
        this.oppositeId = this.temporarySignal.from_id
        const data = WebSocketData.newCanAccept(chatState.user.id, this.oppositeId)
        // chatState.socket.send(JSON.stringify(data))
      }
    }
  }
})
