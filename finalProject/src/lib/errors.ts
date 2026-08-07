export function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error) || !error.message.trim()) return fallback;

  const message = error.message.trim();
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage === 'network error' ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('load failed')
  ) {
    return 'Could not reach the service. Check your internet connection and try again.';
  }
  if (normalizedMessage.includes('timeout')) {
    return 'The service took too long to respond. Check your connection and try again.';
  }

  return message;
}
