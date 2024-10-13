import { newConnection, type OnlineUserModel } from '@/http'
import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'

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

export const useChatState = defineStore('chatState', {
  state: () => ({
    socket: newConnection(),
    historyRecords: ref<HistoryRecords>(new HistoryRecords()),
    onlineUsers: ref<OnlineUserModel[]>([]),
    currentChat: ref<OnlineUserModel | null>(null),
    user: ref<User>(new User()),
    currentRecords: ref<HistoryRecord[]>([]),
    talkTo: ref<User | null>(null)
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

      if (this.talkTo?.id !== fromId) {
        let user = this.onlineUsers.find((e) => e.id === fromId)
        if (user) {
          if (isNaN(user.unread)) {
            user.unread = 0
          }
          user.unread += 1
        }
      }

      nextTick(() => {
        let list = document.getElementById('bubbleList')
        if (list?.children?.length ?? 0 > 0) {
          list?.children[list.children.length! - 1].scrollIntoView({
            behavior: 'smooth'
          })
        }
      })
    },
    removeUser(id: string) {
      if (this.talkTo?.id ?? '' === id) {
        this.talkTo = null
      }
      this.onlineUsers = this.onlineUsers.filter((e) => e.id !== id)
    },
    setTalkTo(user: User) {
      this.talkTo = user
      this.currentRecords = this.historyRecords.get(user.id)
      let tmpUser = this.onlineUsers.find((e) => e.id === user.id)
      tmpUser && (tmpUser.unread = 0)
    },
    sendNewMsg(to: string, msg: string) {
      this.historyRecords.get(to).push(['', msg])
    }
  }
})

export class User {
  id = ''
  name = ''
}
