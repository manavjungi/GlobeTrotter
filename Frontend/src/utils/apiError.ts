import axios from "axios";

interface FastApiValidationItem {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

function isValidationItem(value: unknown): value is FastApiValidationItem {
  return typeof value === "object" && value !== null && "msg" in value;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0 && isValidationItem(detail[0])) {
      return detail[0].msg ?? "Please check the form and try again.";
    }

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }

    if (error.response?.status === 409) {
      return "An account with this email already exists.";
    }

    if (!error.response) {
      return "Unable to reach the server. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}
