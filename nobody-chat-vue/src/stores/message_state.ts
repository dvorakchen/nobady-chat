import { randomUUID } from 'crypto'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * millisecond
 */
const NOTIFICATION_DURATION = 3000

export const useMsgState = defineStore('messageState', {
  state: () => ({
    alerts: ref<AlertProxy[]>([]),
    notifications: ref<Notification[]>([])
  }),
  actions: {
    pushAlert(alert: Alert) {
      const alertProxy = new AlertProxy(alert)
      this.alerts.push(alertProxy)
    },
    pushNotification(notification: Notification) {
      this.notifications.push(notification)
      setTimeout(() => {
        this.notifications = this.notifications.filter((v) => v.id !== notification.id)
      }, notification.duration)
    }
  }
})

class AlertProxy {
  constructor(public alert: Alert) {}

  public id = Math.random()

  private _close = () => {
    const msgState = useMsgState()
    msgState.alerts = msgState.alerts.filter((v) => v.id !== this.id)
  }

  public callPrimaryEvent = () => {
    if (this.alert.primaryEvent !== null) {
      this.alert.primaryEvent(this._close)
    }
  }

  public callSecondaryEvent = () => {
    if (this.alert.secondaryEvent !== null) {
      this.alert.secondaryEvent(this._close)
    }
  }
}

export class Alert {
  constructor(
    public content = '',
    public primaryEvent: Event = null,
    public secondaryEvent: Event = null
  ) {}
}

export type Event = null | ((close: Close) => void)

/**
 * call this function would close the alert
 */
export type Close = () => void

export class Notification {
  constructor(
    /** notification content */
    public content = '',
    /** the duration how long tho notification appears, millisecond */
    public duration = NOTIFICATION_DURATION
  ) {}

  public id = Math.random()
}
