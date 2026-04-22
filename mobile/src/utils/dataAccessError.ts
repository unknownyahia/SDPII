type ErrorLike = {
  code?: unknown;
  message?: unknown;
};

function getErrorLike(error: unknown): ErrorLike {
  return typeof error === 'object' && error !== null ? (error as ErrorLike) : {};
}

export function getErrorCode(error: unknown) {
  const { code } = getErrorLike(error);
  return typeof code === 'string' ? code.toLowerCase() : '';
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong.'
) {
  const { message } = getErrorLike(error);
  return typeof message === 'string' && message.trim()
    ? message
    : fallbackMessage;
}

export function isDataAccessBlockedError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error, '').toLowerCase();

  return (
    code.includes('permission-denied') ||
    code.includes('permission_denied') ||
    code.includes('unauthenticated') ||
    message.includes('missing or insufficient permissions') ||
    message.includes('permission denied') ||
    message.includes('unauthenticated')
  );
}

export function getBlockedDataMessage(scope: string) {
  return `The current Firebase project denied ${scope}. Check deployed Firestore rules and project configuration.`;
}
