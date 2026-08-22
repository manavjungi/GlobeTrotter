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
          className={`rounded-xl border px-3 pb-1.5 ${
            error ? "border-red-400" : "border-brand-soft"
          }`}
        >
          <legend className="ml-2 px-1 text-[11px] text-[#9a9a9a]">{label}</legend>
          <div className="flex items-center gap-3">
            {icon ? <span className="shrink-0 text-[#b0b0b0]">{icon}</span> : null}
            <input
              ref={ref}
              className={`w-full bg-transparent py-1.5 text-sm text-gray-700 outline-none placeholder:text-[#c4c4c4] ${className}`}
              {...props}
            />
          </div>
        </fieldset>
        {error ? <p className="mt-1 ml-3 text-xs text-red-500">{error}</p> : null}
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
          className={`rounded-xl border px-3 pb-1.5 ${
            error ? "border-red-400" : "border-brand-soft"
          }`}
        >
          <legend className="ml-2 px-1 text-[11px] text-[#9a9a9a]">{label}</legend>
          <textarea
            ref={ref}
            className={`w-full resize-none bg-transparent py-1.5 text-sm text-gray-700 outline-none placeholder:text-[#c4c4c4] ${className}`}
            {...props}
          />
        </fieldset>
        {error ? <p className="mt-1 ml-3 text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);
