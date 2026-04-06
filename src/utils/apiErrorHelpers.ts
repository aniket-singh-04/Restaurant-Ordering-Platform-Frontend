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
};

const normalizeFieldName = (field: string) =>
  field.replace(/^(body|params|query)\./, "");

const getErrorBody = (error: unknown): RawErrorBody | null => {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") {
    return null;
  }

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

  for (const fieldError of errorBody?.details?.fieldErrors ?? []) {
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
  return (errorBody?.details?.formErrors ?? []).filter(
    (message): message is string => typeof message === "string" && message.trim().length > 0,
  );
};

export const getApiRequestId = (error: unknown) => {
  const errorBody = getErrorBody(error);
  return typeof errorBody?.requestId === "string" ? errorBody.requestId : undefined;
};
