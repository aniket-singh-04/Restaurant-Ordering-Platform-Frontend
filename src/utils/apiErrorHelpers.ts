import { ApiError } from "./api";

type RawFieldError = {
  field?: string;
  message?: string;
};

type RawErrorBody = {
  message?: string;
  requestId?: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: RawFieldError[];
  };
  formErrors?: unknown;
  fieldErrors?: unknown;
};

const normalizeFieldName = (field: string) =>
  field.replace(/^(body|params|query)\./, "");

const getErrorBody = (error: unknown): RawErrorBody | null => {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") {
    return null;
  }

  // The ApiError.details holds the full parsed response body from the backend.
  // The backend response shape is: { success, message, details: { formErrors, fieldErrors }, requestId }
  // So error.details === the full response body.
  return error.details as RawErrorBody;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Please try again.",
) => {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export const getApiFieldErrors = (error: unknown) => {
  const errorBody = getErrorBody(error);
  const nextErrors: Record<string, string> = {};

  // Field errors can be at errorBody.details.fieldErrors (standard validation)
  // or directly at errorBody.fieldErrors (some AppError details)
  const rawFieldErrors =
    errorBody?.details?.fieldErrors ??
    errorBody?.fieldErrors ??
    [];
  const fieldErrors = Array.isArray(rawFieldErrors) ? rawFieldErrors : [];

  for (const fieldError of fieldErrors) {
    const field = typeof fieldError.field === "string" ? normalizeFieldName(fieldError.field) : "";
    const message = typeof fieldError.message === "string" ? fieldError.message : "";

    if (field && message && !nextErrors[field]) {
      nextErrors[field] = message;
    }
  }

  return nextErrors;
};

export const getApiFormErrors = (error: unknown) => {
  const errorBody = getErrorBody(error);

  // Form errors can be at errorBody.details.formErrors (standard validation)
  // or directly at errorBody.formErrors (some AppError details)
  const rawFormErrors =
    errorBody?.details?.formErrors ??
    errorBody?.formErrors ??
    [];
  const formErrors = Array.isArray(rawFormErrors) ? rawFormErrors : [];

  return formErrors.filter(
    (message: unknown): message is string => typeof message === "string" && String(message).trim().length > 0,
  );
};

export const getApiRequestId = (error: unknown) => {
  const errorBody = getErrorBody(error);
  return typeof errorBody?.requestId === "string" ? errorBody.requestId : undefined;
};
