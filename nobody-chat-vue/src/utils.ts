import { Alert, useMsgState } from './stores/message_state'

export function setOverScroll(value: boolean) {
  document.getElementsByTagName('html')[0].style.overscrollBehavior = value ? 'auto' : 'none'
}

export async function getMediaStreamPermission(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    return stream
  } catch (ex) {
    const msgState = useMsgState()
    msgState.pushAlert(
      new Alert(`获取摄像头权限失败，请通过`, {
        label: '确认',
        func: (close) => {
          close()
        }
      })
    )
    return null
  }
}
