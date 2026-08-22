import axios from "axios";

interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: Record<string, unknown>;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

function collectFieldErrors(errors: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [field, value] of Object.entries(errors)) {
    if (typeof value === "string" && value.trim().length > 0) {
      result[field] = value;
    }
  }

  return result;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error) || !isApiErrorBody(error.response?.data)) {
    return {};
  }

  const { errors } = error.response.data;
  if (!errors) {
    return {};
  }

  return collectFieldErrors(errors);
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (isApiErrorBody(data)) {
      if (typeof data.message === "string" && data.message.trim().length > 0) {
        return sanitizeApiMessage(data.message);
      }

      const fieldMessages = Object.values(getApiFieldErrors(error));
      if (fieldMessages.length > 0) {
        return fieldMessages.join(". ");
      }
    }

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }

    if (error.response?.status === 403) {
      return "Account is inactive.";
    }

    if (error.response?.status === 409) {
      return "Email or username already exists.";
    }

    if (!error.response) {
      return "Unable to reach the server. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

function sanitizeApiMessage(message: string): string {
  if (/relation ["'].+["'] does not exist/i.test(message) || /column .+ does not exist/i.test(message)) {
    return "Some travel data is unavailable right now. Please try again later.";
  }
  if (/internal server error/i.test(message)) {
    return "We couldn't complete that request. Please try again.";
  }
  return message;
}
