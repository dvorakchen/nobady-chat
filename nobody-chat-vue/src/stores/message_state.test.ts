import { createPinia, setActivePinia } from 'pinia'
import { Alert, Notification, useMsgState, type Close, type Event } from './message_state'
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

  it('alert: push a alert without event', () => {
    const EXPECTED_LENGTH = 1
    const EXPECTED_CONTENT = ''

    const alert = new Alert(EXPECTED_CONTENT, null, null)

    const msgState = useMsgState()
    msgState.pushAlert(alert)

    expect(msgState.alerts.length).toBe(EXPECTED_LENGTH)
    expect(msgState.alerts[0].content).toBe(EXPECTED_CONTENT)
    expect(msgState.alerts[0].hasPrimaryEvent).toBeFalsy()
    expect(msgState.alerts[0].hasSecondaryEvent).toBeFalsy()
  })

  it('alert: push two alerts without event', () => {
    const FULL_ALERT_CONTENT = 'TECH NO BORDERS'

    const FULL_ALERT_EVENT = {
      label: '',
      func: () => {}
    }

    const EXPECTED_LENGTH = 2

    const alert_empty = new Alert('', null, null)
    const alert_full = new Alert(FULL_ALERT_CONTENT, FULL_ALERT_EVENT, FULL_ALERT_EVENT)

    const msgState = useMsgState()
    msgState.pushAlert(alert_empty)
    msgState.pushAlert(alert_full)

    expect(msgState.alerts.length).toBe(EXPECTED_LENGTH)

    expect(msgState.alerts[0].content).toBe('')
    expect(msgState.alerts[0].hasPrimaryEvent).toBeFalsy()
    expect(msgState.alerts[0].hasSecondaryEvent).toBeFalsy()

    expect(msgState.alerts[1].content).toBe(FULL_ALERT_CONTENT)
    expect(msgState.alerts[1].hasPrimaryEvent).toBeTruthy()
    expect(msgState.alerts[1].hasSecondaryEvent).toBeTruthy()
  })

  it('alert: click primary event', () => {
    const FULL_ALERT_CONTENT = 'TECH NO BORDERS'
    const FULL_PRIMARY_LABEL = 'PRIMARY'
    const FULL_SECONDARY_LABEL = 'SECONDARY'

    const PRIMARY_CLOSE_EVENT: Event = {
      label: FULL_PRIMARY_LABEL,
      func: (close: Close) => {
        close()
      }
    }

    const SECONDARY_CLOSE_EVENT: Event = {
      label: FULL_SECONDARY_LABEL,
      func: (close: Close) => {
        close()
      }
    }

    const alert = new Alert(FULL_ALERT_CONTENT, PRIMARY_CLOSE_EVENT, SECONDARY_CLOSE_EVENT)

    const msgState = useMsgState()
    msgState.pushAlert(alert)

    expect(msgState.alerts.length).toBe(1)
    expect(msgState.alerts[0].primaryLabel).toBe(FULL_PRIMARY_LABEL)
    expect(msgState.alerts[0].secondaryLabel).toBe(FULL_SECONDARY_LABEL)
    expect(msgState.alerts[0].hasPrimaryEvent).toBeTruthy()
    expect(msgState.alerts[0].hasSecondaryEvent).toBeTruthy()

    msgState.alerts[0].callPrimaryEvent()

    expect(msgState.alerts.length).toBe(0)
  })

  it('alert: click two events', () => {
    const FULL_ALERT_CONTENT = 'TECH NO BORDERS'
    const FULL_PRIMARY_LABEL = 'PRIMARY'
    const FULL_SECONDARY_LABEL = 'SECONDARY'

    const PRIMARY_CLOSE_EVENT: Event = {
      label: FULL_PRIMARY_LABEL,
      func: (close: Close) => {
        close()
      }
    }

    const SECONDARY_CLOSE_EVENT: Event = {
      label: FULL_SECONDARY_LABEL,
      func: () => {}
    }

    const alert = new Alert(FULL_ALERT_CONTENT, PRIMARY_CLOSE_EVENT, SECONDARY_CLOSE_EVENT)

    const msgState = useMsgState()
    msgState.pushAlert(alert)

    expect(msgState.alerts.length).toBe(1)
    expect(msgState.alerts[0].primaryLabel).toBe(FULL_PRIMARY_LABEL)
    expect(msgState.alerts[0].secondaryLabel).toBe(FULL_SECONDARY_LABEL)

    msgState.alerts[0].callSecondaryEvent()
    expect(msgState.alerts.length).toBe(1)

    msgState.alerts[0].callPrimaryEvent()
    expect(msgState.alerts.length).toBe(0)
  })

  it('notification: push notification', async () => {
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
