import { defineStore } from 'pinia'
import { User, type OnlineUser, type RecvMsg } from '@/models'
import { nextTick, ref, useTemplateRef, type ShallowRef } from 'vue'
import type {
  Msg,
  NetSocketDataType,
  RegisterEventable,
  SetUser,
  UserOffline,
  UserOnline
} from '@/net/netsocket'

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

export const useChatState = defineStore('ChatState', () => {
  const onlineUsers = ref<OnlineUser[]>([])
  const user = ref<User>(new User())
  const historyRecords = ref<HistoryRecords>(new HistoryRecords())
  const talkTo = ref<TalkTo | null>(null)
  const bubbleList: ShallowRef<HTMLUListElement | null> = useTemplateRef('bubble-list')

  function bindSocket(register: RegisterEventable) {
    register.registerEvent('setUser', bindSetUser)
    register.registerEvent('userOnline', bindUserOnline)
    register.registerEvent('msg', bindMsg)
    register.registerEvent('userOffline', bindUserOffline)
    register.registerEvent('signal', bindSignal)
  }

  function findUsername(id: string): string {
    return onlineUsers.value.find((u) => u.id === id)?.name ?? ''
  }

  function bindSetUser(data: NetSocketDataType) {
    data = data as SetUser

    user.value.id = data.setUser.id
    user.value.name = data.setUser.name

    onlineUsers.value.unshift({
      id: data.setUser.id,
      name: data.setUser.name,
      unread: 0
    })
  }

  function bindUserOnline(data: NetSocketDataType) {
    data = data as UserOnline

    onlineUsers.value.push({
      id: data.userOnline.id,
      name: data.userOnline.name,
      unread: 0
    })
  }

  function bindMsg(data: NetSocketDataType) {
    data = data as Msg

    const { from, msg } = data.msg
    const fromId = from

    let record = historyRecords.value.get(fromId)
    record.push([msg, ''])

    if (talkTo.value?.user.id !== fromId) {
      const user = onlineUsers.value.find((u) => u.id === fromId)
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
  }

  function bindUserOffline(data: NetSocketDataType) {
    data = data as UserOffline
    const id = data.userOffline.id

    if (user.value.id === id) {
      return
    }

    if (talkTo.value?.user.id ?? '' === id) {
      talkTo.value = null
    }
    onlineUsers.value = onlineUsers.value.filter((t) => t.id !== id)
  }

  function bindSignal(data: NetSocketDataType) {
    // TODO: handle signal
  }

  function setTalkTo(user: User) {
    if (!user) {
      return
    }

    const newTalkTo = new TalkTo()
    newTalkTo.user = user
    newTalkTo.records = historyRecords.value.get(user.id)

    talkTo.value = newTalkTo

    let tmpUser = onlineUsers.value.find((u) => u.id === user.id)
    tmpUser && (tmpUser.unread = 0)
  }

  function newRecord(to: string, msg: string) {
    historyRecords.value.get(to).push(['', msg])
  }

  function bubbleListToEnd() {
    if (bubbleList.value?.children?.length ?? 0 > 0) {
      bubbleList.value?.children[bubbleList.value.children.length! - 1].scrollIntoView({
        behavior: 'smooth'
      })
    }
  }

  function appendOnlineUsers(...newOnlineUsers: OnlineUser[]) {
    for (const u of newOnlineUsers) {
      if (onlineUsers.value.some((e) => e.id === u.id)) {
        continue
      }

      onlineUsers.value.push(u)
    }
  }

  return {
    bubbleList,
    onlineUsers,
    user,
    talkTo,
    setTalkTo,
    newRecord,
    bindSocket,
    bubbleListToEnd,
    appendOnlineUsers,
    findUsername
  }
})

export class TalkTo {
  user: User = new User()
  records: HistoryRecord[] = []
}
