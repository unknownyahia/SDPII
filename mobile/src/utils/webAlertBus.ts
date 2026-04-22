export const WEB_ALERT_EVENT = 'spots:web-alert';

export type WebAlertPayload = {
  id: string;
  title: string;
  message?: string;
};
