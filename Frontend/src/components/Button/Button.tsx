import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({
  children,
  isLoading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`flex h-12 w-full items-center justify-center rounded-md bg-brand text-sm font-semibold tracking-[0.18em] text-white uppercase transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
