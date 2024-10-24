import { createPinia, setActivePinia } from 'pinia'
import { Alert, Notification, useMsgState, type Close } from './message_state'
import { expect, describe, it, beforeEach } from 'vitest'

describe('test msg state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('init message state', () => {
    const EXPECTED_INIT_LENGTH = 0

    const msgState = useMsgState()

    expect(msgState.alerts.length).toBe(EXPECTED_INIT_LENGTH)
    expect(msgState.notifications.length).toBe(EXPECTED_INIT_LENGTH)
  })

  it('push a alert without event', () => {
    const EXPECTED_LENGTH = 1
    const EXPECTED_CONTENT = ''

    const alert = new Alert('', null, null)

    const msgState = useMsgState()
    msgState.pushAlert(alert)

    expect(msgState.alerts.length).toBe(EXPECTED_LENGTH)

    let retrievedAlert = msgState.alerts[0].alert
    expect(retrievedAlert.content).toBe(EXPECTED_CONTENT)
    expect(retrievedAlert.primaryEvent).toBe(null)
    expect(retrievedAlert.secondaryEvent).toBe(null)
  })

  it('push two alerts without event', () => {
    const FULL_ALERT_CONTENT = 'TECH NO BORDERS'
    const FULL_ALERT_EVENT = () => {}
    const EXPECTED_LENGTH = 2

    const alert_empty = new Alert('', null, null)
    const alert_full = new Alert(FULL_ALERT_CONTENT, FULL_ALERT_EVENT, FULL_ALERT_EVENT)

    const msgState = useMsgState()
    msgState.pushAlert(alert_empty)
    msgState.pushAlert(alert_full)

    expect(msgState.alerts.length).toBe(EXPECTED_LENGTH)

    expect(msgState.alerts[0].alert.content).toBe('')
    expect(msgState.alerts[0].alert.primaryEvent).toBe(null)
    expect(msgState.alerts[0].alert.secondaryEvent).toBe(null)

    expect(msgState.alerts[1].alert.content).toBe(FULL_ALERT_CONTENT)
    expect(msgState.alerts[1].alert.primaryEvent).toBe(FULL_ALERT_EVENT)
    expect(msgState.alerts[1].alert.secondaryEvent).toBe(FULL_ALERT_EVENT)
  })

  it('click primary event', () => {
    const FULL_ALERT_CONTENT = 'TECH NO BORDERS'

    const CLOSE_EVENT = (close: Close) => {
      close()
    }

    const alert = new Alert(FULL_ALERT_CONTENT, CLOSE_EVENT, CLOSE_EVENT)

    const msgState = useMsgState()
    msgState.pushAlert(alert)

    expect(msgState.alerts.length).toBe(1)

    msgState.alerts[0].callPrimaryEvent()

    expect(msgState.alerts.length).toBe(0)
  })

  it('push notification', async () => {
    const EXPECTED_CONTENT = 'TECH HAS NO BORDERS'
    const EXPECT_DURATION = 1 // second

    const msgState = useMsgState()

    msgState.pushNotification(new Notification(EXPECTED_CONTENT, EXPECT_DURATION))

    expect(msgState.notifications.length).toBe(1)

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined)
      }, EXPECT_DURATION)
    })

    expect(msgState.notifications.length).toBe(0)
  })
})
