interface ApiErrorBody {
  error?: { code?: string; message?: string };
  code?: string;
  message?: string;
  detail?: unknown;
}

// The backend wraps errors as { success: false, error: { code, message } }.
export const getApiError = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): { code?: string; message: string } => {
  const response = (err as { response?: { data?: ApiErrorBody } } | undefined)?.response;
  if (!response) {
    return { message: 'Could not reach the server. Please try again.' };
  }
  const data = response.data;
  const code = data?.error?.code ?? data?.code;
  const message =
    data?.error?.message ?? data?.message ?? (typeof data?.detail === 'string' ? data.detail : undefined);
  return { code, message: message ?? fallback };
};
