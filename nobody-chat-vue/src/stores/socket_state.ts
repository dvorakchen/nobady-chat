import { NetSocket, NetSocketSendData } from '@/net/netsocket'
import { defineStore } from 'pinia'
import { useChatState } from '@/stores/chat_state'

export const useNetSocket = defineStore('netSocket', {
  state: () => ({
    netSocket: new NetSocket()
  }),
  actions: {
    bindSocket() {
      const chatState = useChatState()
      chatState.bindSocket(this.netSocket)
    },

    sendTalkTo(to: string, msg: string) {
      const data = JSON.stringify(NetSocketSendData.newTalkTo(to, msg))
      this.netSocket.send(data)
    }
  }
})
