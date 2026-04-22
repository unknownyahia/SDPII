import {
  WEB_ALERT_EVENT,
  type WebAlertPayload,
} from './webAlertBus';

type PendingAlert = {
  title: string;
  message?: string;
};

const ALERT_BATCH_DELAY_MS = 150;

let pendingAlerts: PendingAlert[] = [];
let flushTimer: ReturnType<typeof window.setTimeout> | null = null;

function buildAlertText(title: string, message?: string) {
  return message ? `${title}\n\n${message}` : title;
}

function buildBatchedAlert(alerts: PendingAlert[]) {
  if (alerts.length === 1) {
    return alerts[0];
  }

  const [firstAlert, ...restAlerts] = alerts;
  const restText = restAlerts
    .map(alert => buildAlertText(alert.title, alert.message))
    .join('\n\n');

  return {
    title: firstAlert.title,
    message: `${firstAlert.message ?? ''}${
      firstAlert.message ? '\n\n' : ''
    }More issues:\n\n${restText}`,
  };
}

function flushPendingAlerts() {
  flushTimer = null;

  if (pendingAlerts.length === 0) {
    return;
  }

  const alertsToShow = pendingAlerts;
  pendingAlerts = [];
  const nextAlert = buildBatchedAlert(alertsToShow);

  if (typeof window.CustomEvent === 'function') {
    const payload: WebAlertPayload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: nextAlert.title,
      message: nextAlert.message,
    };

    window.dispatchEvent(
      new window.CustomEvent(WEB_ALERT_EVENT, {
        detail: payload,
      })
    );
    return;
  }

  if (typeof console !== 'undefined') {
    console.warn(buildAlertText(nextAlert.title, nextAlert.message));
  }
}

export function showAlert(title: string, message?: string) {
  if (typeof window !== 'undefined') {
    pendingAlerts.push({ title, message });

    if (flushTimer === null) {
      flushTimer = window.setTimeout(flushPendingAlerts, ALERT_BATCH_DELAY_MS);
    }

    return;
  }

  if (typeof console !== 'undefined') {
    console.warn(buildAlertText(title, message));
  }
}
