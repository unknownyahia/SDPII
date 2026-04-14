function buildAlertText(title: string, message?: string) {
  return message ? `${title}\n\n${message}` : title;
}

export function showAlert(title: string, message?: string) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(buildAlertText(title, message));
    return;
  }

  if (typeof console !== 'undefined') {
    console.warn(buildAlertText(title, message));
  }
}
