import type { ReactNode } from "react";
import airplane from "@/assets/auth/airplane.png";
import hero from "@/assets/auth/hero.png";
import landmarks from "@/assets/auth/landmarks.png";
import taj from "@/assets/auth/taj.png";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <section className="relative hidden min-h-screen w-1/2 overflow-hidden lg:sticky lg:top-0 lg:block lg:h-screen">
        <img
          src={hero}
          alt="Traveler overlooking mountain ranges"
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="relative z-10 flex h-full flex-col items-center px-12 pt-16 text-center text-white">
          <h1
            className="font-script text-[4.35rem] leading-none"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}
          >
            GlobeTrotter
          </h1>
          <p
            className="mt-5 max-w-md text-[0.95rem] font-light leading-7"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
          >
            Travel is the only purchase that enriches you in ways beyond material wealth
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white lg:w-1/2">
        <div className="flex items-center justify-center bg-[linear-gradient(180deg,#3aa4d6_0%,#1d7fb8_100%)] px-6 py-8 text-center text-white lg:hidden">
          <div>
            <h1 className="font-script text-5xl leading-none">GlobeTrotter</h1>
            <p className="mt-3 text-xs font-light leading-5 opacity-90">
              Travel is the only purchase that enriches you in ways beyond material wealth
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-10 pb-28 sm:px-8">
          <div className="relative mb-7">
            <img
              src={airplane}
              alt=""
              className="pointer-events-none absolute -top-6 right-0 w-[168px] select-none sm:-top-7 sm:w-[190px]"
            />
            <h2 className="text-[2.35rem] font-semibold text-brand">{title}</h2>
            <p className="mt-1 text-sm text-[#b0b0b0]">{subtitle}</p>
          </div>
          {children}
        </div>

        <img
          src={taj}
          alt=""
          className="pointer-events-none absolute bottom-0 left-2 w-[150px] select-none sm:left-4 sm:w-[170px]"
        />
        <img
          src={landmarks}
          alt=""
          className="pointer-events-none absolute right-2 bottom-0 w-[150px] select-none sm:right-4 sm:w-[176px]"
        />
      </section>
    </div>
  );
}

interface SocialLoginRowProps {
  onUnavailable: (provider: string) => void;
}

export function SocialLoginRow({ onUnavailable }: SocialLoginRowProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 text-[#c4c4c4]">
        <span className="h-px flex-1 bg-[#d9d9d9]" />
        <span className="text-xs tracking-wide">OR</span>
        <span className="h-px flex-1 bg-[#d9d9d9]" />
      </div>
      <div className="mt-5 flex items-center justify-center gap-5">
        <SocialButton label="Google" onClick={() => onUnavailable("Google")}>
          <GoogleLogo />
        </SocialButton>
        <SocialButton label="Facebook" onClick={() => onUnavailable("Facebook")}>
          <FacebookLogo />
        </SocialButton>
        <SocialButton label="Apple" onClick={() => onUnavailable("Apple")}>
          <AppleLogo />
        </SocialButton>
      </div>
    </div>
  );
}

function SocialButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={`Continue with ${label}`}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-wash transition hover:bg-[#d7eef4]"
    >
      {children}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1 7.9-2.8l-4-3c-1.1.8-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1.9v3.1C3.9 21.3 7.7 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.5 14.6A7.2 7.2 0 0 1 5.1 12c0-.9.2-1.8.4-2.6V6.3H1.9A12 12 0 0 0 0 12c0 1.9.5 3.7 1.9 5.3l3.6-2.7z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9.9 15.2 0 12 0 7.7 0 3.9 2.7 1.9 6.3l3.6 2.8C6.4 6.8 9 4.8 12 4.8z"
      />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9V12h3.4l-.5 3.6h-2.9V24C19.6 23.1 24 18.1 24 12.1z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 22" aria-hidden="true">
      <path
        fill="#111"
        d="M14.7 11.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.8 0-1.9-.8-3.3-.8-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.2 3.2-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1 -2.5-3.8zM12.1 4.6c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.3-.6 3-1.5z"
      />
    </svg>
  );
}
