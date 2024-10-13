import { newConnection, type OnlineUserModel } from '@/http'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const provideKey = Symbol()

export type HistoryRecord = [string, string]
export class HistoryRecords {
  private records: Map<string, HistoryRecord[]> = new Map()

  public get(id: string): HistoryRecord[] {
    let rs = this.records.get(id)
    if (rs === undefined) {
      rs = []
      this.records.set(id, rs)
    }

    return rs
  }
}

export type ChatStateModel = {
  sockect: WebSocket
  historyRecords: HistoryRecords
  onlineUsers: Ref<OnlineUserModel[], OnlineUserModel[]>
  currentChat: Ref<OnlineUserModel | null, OnlineUserModel | null>
  user: User
  currentRecords: Ref<HistoryRecord[]>

  setCurrentChat: (value: OnlineUserModel) => {}
  talkTo: (user: OnlineUserModel) => {}
  sendNewMsg: (to: string, msg: string) => {}
}

export const useChatState = defineStore('chatState', {
  state: () => ({
    socket: newConnection(),
    historyRecords: ref<HistoryRecords>(new HistoryRecords()),
    onlineUsers: ref<OnlineUserModel[]>([]),
    currentChat: ref<OnlineUserModel | null>(null),
    user: ref<User>(new User()),
    currentRecords: ref<HistoryRecord[]>([])
  }),
  actions: {
    setCurrentChat(value: OnlineUserModel) {
      this.currentChat = value
    },
    setUserInfo(user: OnlineUserModel) {
      this.user.id = user.id
      this.user.name = user.name

      this.onlineUsers.unshift({
        id: user.id,
        name: user.name,
        unread: 0
      })
    },
    newUserOnline(user: OnlineUserModel) {
      this.onlineUsers.push({
        id: user.id,
        name: user.name,
        unread: 0
      })
    },
    receiveMsg(fromId: string, msg: string) {
      let record = this.historyRecords.get(fromId)
      record.push([msg, ''])

      if (this.user.talkTo?.id === fromId) {
        this.currentRecords.push([msg, ''])
      } else {
        let user = this.onlineUsers.find((e) => e.id === fromId)
        if (user) {
          if (isNaN(user.unread)) {
            user.unread = 0
          }
          user.unread += 1
        }
      }
    },
    removeUser(id: string) {
      if (this.user.talkTo?.id ?? '' === id) {
        this.user.talkTo = null
      }
      this.onlineUsers = this.onlineUsers.filter((e) => e.id !== id)
    },
    talkTo(user: OnlineUserModel) {
      console.log('in talkTo pinia, user: ', user)
      this.user.talkTo = user
      console.log('this.user.talkTo: ', this.user.talkTo)
      this.currentRecords = this.historyRecords.get(user.id)
      let tmpUser = this.onlineUsers.find((e) => e.id === user.id)
      tmpUser && (tmpUser.unread = 0)
    },
    sendNewMsg(to: string, msg: string) {
      this.historyRecords.get(to).push(['', msg])
      this.currentRecords.push(['', msg])
    }
  }
})

export class User {
  id = ''
  name = ''
  talkTo: OnlineUserModel | null = null
}
