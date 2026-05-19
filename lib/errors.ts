/** Extrae mensaje legible de errores Axios/FastAPI. */
export function getApiErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { detail?: unknown } } }).response?.data;
    const detail = data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
