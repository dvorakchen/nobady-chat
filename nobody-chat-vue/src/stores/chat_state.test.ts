import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useChatState } from './chat_state'
import { createPinia, setActivePinia } from 'pinia'
import { User } from '@/models'
import type { Msg, NetSocketDataType, SetUser, UserOnline } from '@/net/netsocket'

describe('test chat_state setTalkTo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('test setTalkTo', () => {
    const EXPECTED_ID = 'ID'
    const EXPECETD_NAME = 'NAME'

    const chatState = useChatState()

    expect(chatState.talkTo).toBeNull()

    const user = { id: EXPECTED_ID, name: EXPECETD_NAME } as User
    chatState.setTalkTo(user)

    expect(chatState.talkTo).not.toBeNull()
    expect(chatState.talkTo?.user.id).toBe(EXPECTED_ID)
    expect(chatState.talkTo?.user.name).toBe(EXPECETD_NAME)
    expect(chatState.talkTo?.records.length).toBe(0)
  })
})

describe('test socket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('setUser', () => {
    const EXPECTED_ID = 'ID'
    const EXPECTED_NAME = 'NAME'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    expect(chatState.user.id).toBe('')
    expect(chatState.user.name).toBe('')

    socket.emit('setUser', { setUser: { id: EXPECTED_ID, name: EXPECTED_NAME } } as SetUser)

    expect(chatState.user.id).toBe(EXPECTED_ID)
    expect(chatState.user.name).toBe(EXPECTED_NAME)

    expect(chatState.onlineUsers.length).toBe(1)
  })

  it('newRecord', () => {
    const EXPECTED_FROM_ID = 'FROM'
    const EXPECTED_MSG = 'Message'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    expect(chatState.talkTo).toBeNull()

    socket.emit('msg', { msg: { from: EXPECTED_FROM_ID, msg: EXPECTED_MSG } } as Msg)
    expect(chatState.talkTo).toBeNull()

    const user = new User()
    user.id = EXPECTED_FROM_ID
    user.name = 'name'
    chatState.setTalkTo(user)

    expect(chatState.talkTo).not.toBeNull()
    expect(chatState.talkTo!.records.length).toBe(1)
    expect(chatState.talkTo!.records[0][0]).toBe(EXPECTED_MSG)
    expect(chatState.talkTo!.records[0][1]).toBe('')
  })

  it('newRecord 2', () => {
    const EXPECTED_FROM_ID = 'FROM'
    const EXPECTED_MSG = 'Message'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    expect(chatState.talkTo).toBeNull()
    const user = new User()
    user.id = EXPECTED_FROM_ID
    user.name = 'name'
    chatState.setTalkTo(user)

    expect(chatState.talkTo).not.toBeNull()
    expect(chatState.talkTo!.records.length).toBe(0)

    socket.emit('msg', { msg: { from: EXPECTED_FROM_ID, msg: EXPECTED_MSG } } as Msg)

    expect(chatState.talkTo!.records.length).toBe(1)
    expect(chatState.talkTo?.records[0][0]).toBe(EXPECTED_MSG)
    expect(chatState.talkTo?.records[0][1]).toBe('')
  })

  it('removeUser self', () => {
    const EXPECTED_ID = 'id'
    const EXPECTED_NAME = 'name'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    socket.emit('setUser', { setUser: { id: EXPECTED_ID, name: EXPECTED_NAME } } as SetUser)

    expect(chatState.user.id).toBe(EXPECTED_ID)
    expect(chatState.user.name).toBe(EXPECTED_NAME)
    expect(chatState.onlineUsers.length).toBe(1)

    socket.emit('userOffline', {
      userOffline: {
        id: EXPECTED_ID,
        name: EXPECTED_NAME
      }
    })

    expect(chatState.onlineUsers.length).toBe(1)
  })

  it('userOnline other', () => {
    const EXPECTED_ID_1 = 'id'
    const EXPECTED_NAME_1 = 'name'
    const EXPECTED_ID_2 = 'id2'
    const EXPECTED_NAME_2 = 'name2'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    socket.emit('userOnline', {
      userOnline: { id: EXPECTED_ID_1, name: EXPECTED_NAME_1 }
    } as UserOnline)

    socket.emit('userOnline', {
      userOnline: {
        id: EXPECTED_ID_2,
        name: EXPECTED_NAME_2
      }
    })

    expect(chatState.onlineUsers.length).toBe(2)
  })

  it('userOffline other', () => {
    const EXPECTED_ID = 'id'
    const EXPECTED_NAME = 'name'

    const chatState = useChatState()
    const socket = new FakeSocket()
    chatState.bindSocket(socket)

    socket.emit('userOnline', {
      userOnline: { id: EXPECTED_ID, name: EXPECTED_NAME }
    } as UserOnline)

    expect(chatState.user.id).toBe('')
    expect(chatState.user.name).toBe('')
    expect(chatState.onlineUsers.length).toBe(1)

    socket.emit('userOffline', {
      userOffline: {
        id: EXPECTED_ID,
        name: EXPECTED_NAME
      }
    })

    expect(chatState.onlineUsers.length).toBe(0)
  })
})

const FakeSocket = vi.fn()

FakeSocket.mockImplementation(() => ({
  bulk: new Map(),

  registerEvent(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    event: (entry: NetSocketDataType) => void
  ): void {
    this.bulk.set(msgType, event)
  },

  emit(
    msgType: 'setUser' | 'userOnline' | 'msg' | 'userOffline' | 'signal',
    entry: NetSocketDataType
  ) {
    this.bulk.get(msgType)?.(entry)
  }
}))
