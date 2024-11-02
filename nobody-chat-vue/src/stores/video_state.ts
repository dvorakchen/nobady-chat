import { User } from '@/models'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useChatState } from './chat_state'
import { Alert, Notification, useMsgState } from './message_state'
import type { BaseSignal, One2OneSignalServer, Selector } from '@/signal/one2one'
import { RTC121 } from '@/signal/rtc_121'

export const useVideoState = defineStore('videoState', () => {
  const rtc: One2OneSignalServer = new RTC121('localVideo', 'remoteVideo')
  const to = ref(null as null | User)
  let state = ref('free' as VideoState)

  prepare()

  function prepare() {
    rtc.handleRequest((si) => {
      return new Promise((resolve) => {
        if (si.to_id !== user.value.id) {
          resolve(false)
          return
        }

        const msgState = useMsgState()
        if (state.value !== 'free' || !rtc.localVideo || !rtc.remoteVideo) {
          let warn = ''
          if (state.value !== 'free') {
            warn += 'not free now'
          }
          if (!rtc.localVideo) {
            warn += ', not set localVideo'
          }
          if (!rtc.remoteVideo) {
            warn += ', not set remoteVideo'
          }
          msgState.pushNotification(new Notification(`rejected requesting: ${warn}`))
          resolve(false)
          return
        }

        const chatState = useChatState()
        const name = chatState.findUsername(si.from_id)

        msgState.pushAlert(
          new Alert(
            `${name} 请求视频通话`,
            {
              label: '接受',
              func: (close) => {
                state.value = 'offering'
                rtc.setBase({ from_id: user.value.id, to_id: si.from_id } as BaseSignal)
                resolve(true)
                close()
              }
            },
            {
              label: '拒绝',
              func(close) {
                resolve(false)
                close()
              }
            }
          )
        )
      })
    })

    rtc.handleOffer(async (si) => {
      if (si.to_id !== user.value.id) {
        return false
      }
      if (state.value === 'waitOffering') {
        state.value = 'communicating'
        return true
      }
      return false
    })

    rtc.handleAnswer(async (si) => {
      if (si.to_id !== user.value.id || state.value !== 'offering') {
        return false
      }
      state.value = 'communicating'
      return true
    })

    rtc.handleDeny(async () => {
      const msgState = useMsgState()

      msgState.pushNotification(new Notification('对方拒绝了你'))
      state.value = 'free'
      return true
    })
  }

  const user = computed(() => {
    const chatState = useChatState()
    return chatState.user
  })

  const isShowScreen = computed(() => {
    return state.value !== 'free' && state.value !== 'offering'
  })

  const isShowConnecting = computed(() => {
    return state.value !== 'free' && state.value !== 'communicating'
  })

  function setVideoElements(local: Selector, remote: Selector): void {
    rtc.localVideo = local
    rtc.remoteVideo = remote
  }

  function requestVideoCommunicate() {
    const msgState = useMsgState()
    rtc.setBase({ from_id: user.value.id, to_id: to.value!.id } as BaseSignal)
    if (state.value !== 'free') {
      msgState.pushNotification(new Notification('视频通讯中，无法开启新的视频通讯'))
      return
    }
    state.value = 'waitOffering'
    rtc.sendRequest()

    // requestTimer = setTimeout(() => {
    //   msgState.pushNotification(new Notification('请求视频通讯超时'))
    //   state = 'free'
    // }, 5000)
  }

  function hangUp() {
    rtc.stop()
    state.value = 'free'
  }

  return {
    to,
    state,
    user,
    isShowConnecting,
    isShowScreen,
    setVideoElements,
    requestVideoCommunicate,
    hangUp
  }
})

export type VideoState =
  | 'free' /* nothing doing */
  | 'offering' /* negotiating */
  | 'waitOffering' /* applied a request, wait for onswer of opposite */
  | 'communicating' /* connection successful, communicating */
