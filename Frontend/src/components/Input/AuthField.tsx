import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, icon, error, className = "", ...props }, ref) {
    return (
      <div className="w-full">
        <fieldset
          className={`rounded-xl border bg-white px-3 pb-1.5 transition duration-150 ${
            error
              ? "border-red-400"
              : "border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
          }`}
        >
          <legend className="ml-2 px-1 text-[11px] font-medium tracking-wide text-muted">{label}</legend>
          <div className="flex items-center gap-3">
            {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
            <input
              ref={ref}
              aria-invalid={Boolean(error)}
              className={`w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-300 ${className}`}
              {...props}
            />
          </div>
        </fieldset>
        {error ? <p className="mt-1 ml-3 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  },
);

interface AuthTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const AuthTextArea = forwardRef<HTMLTextAreaElement, AuthTextAreaProps>(
  function AuthTextArea({ label, error, className = "", ...props }, ref) {
    return (
      <div className="w-full">
        <fieldset
          className={`rounded-xl border bg-white px-3 pb-1.5 transition duration-150 ${
            error
              ? "border-red-400"
              : "border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
          }`}
        >
          <legend className="ml-2 px-1 text-[11px] font-medium tracking-wide text-muted">{label}</legend>
          <textarea
            ref={ref}
            aria-invalid={Boolean(error)}
            className={`w-full resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-300 ${className}`}
            {...props}
          />
        </fieldset>
        {error ? <p className="mt-1 ml-3 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  },
);
