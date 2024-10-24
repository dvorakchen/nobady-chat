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

  public get content(): string {
    return this.alert.content
  }

  public get primaryLabel(): string {
    return this.alert.primaryLabel
  }

  public get secondaryLabel(): string {
    return this.alert.secondaryLabel
  }

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

/**
 * indicating a Alert, normally on the top of the page, and would not disappears automatically.
 *
 * use this with store `msgState()`
 *
 * # Examples:
 * ```
 * const msgState = useMsgState()
 *
 * const alert = new Alert('show content', 'primary button', 'secondary button',
 *  (close) => { close() },
 *  (close) => { close() })
 * msgState.pushAlert(new Alert())
 * ```
 */
export class Alert {
  constructor(
    /** content */
    public content = '',
    /** the label of primary button */
    public primaryLabel = '',
    /** the label of secondary button */
    public secondaryLabel = '',
    /**
     * the event of primary button, if null, the primary button would not display
     *
     * if you want to close this alert after click the button, just call the `close()` function that passes into the parameter
     *
     * # Example:
     * ```
     * const msgState = useMsgState()
     *
     * const alert = new Alert('show content', 'primary button', 'secondary button',
     *  (close) => {
     *      close() //  alert would be closed
     *    },
     *  (close) => { close() })
     * msgState.pushAlert(new Alert())
     * ```
     * */
    public primaryEvent: Event = null,
    /**
     * the event of secondary button, if null, the secondary button would not display
     *
     * if you want to close this alert after click the button, just call the `close()` function that passes into the parameter
     *
     * # Example:
     * ```
     * const msgState = useMsgState()
     *
     * const alert = new Alert('show content', 'primary button', 'secondary button',
     *  (close) => {
     *     close() //  alert would be closed
     *   },
     *  (close) => {
     *     close() //  alert would be closed
     *  })
     * msgState.pushAlert(new Alert())
     * ```
     * */
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
