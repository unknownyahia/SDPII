import { Alert } from 'react-native';

type PendingAlert = {
  title: string;
  message?: string;
};

const ALERT_BATCH_DELAY_MS = 150;

let pendingAlerts: PendingAlert[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

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

  const nextAlert = buildBatchedAlert(pendingAlerts);
  pendingAlerts = [];
  Alert.alert(nextAlert.title, nextAlert.message);
}

export function showAlert(title: string, message?: string) {
  pendingAlerts.push({ title, message });

  if (flushTimer === null) {
    flushTimer = setTimeout(flushPendingAlerts, ALERT_BATCH_DELAY_MS);
  }
}
