import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout, SocialLoginRow } from "@/components/AuthLayout/AuthLayout";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField } from "@/components/Input/AuthField";
import { EnvelopeIcon, LockIcon } from "@/components/Input/icons";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage, getApiFieldErrors } from "@/utils/apiError";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState(
    location.state && typeof location.state === "object" && "notice" in location.state
      ? String((location.state as { notice?: string }).notice ?? "")
      : "",
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError("");
    setNotice("");
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      if (fieldErrors.email) {
        setError("email", { type: "server", message: fieldErrors.email });
      }
      if (fieldErrors.password) {
        setError("password", { type: "server", message: fieldErrors.password });
      }
      setFormError(getApiErrorMessage(error));
    }
  }

  return (
    <AuthLayout title="Welcome" subtitle="Login with Email">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          label="Email Id"
          type="email"
          autoComplete="email"
          placeholder="john@example.com"
          icon={<EnvelopeIcon />}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="***********"
          icon={<LockIcon />}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-[#b5b5b5] transition hover:text-brand"
            onClick={() =>
              setNotice("Password reset is not available yet. Please try again later.")
            }
          >
            Forgot your password?
          </button>
        </div>

        {formError ? <ErrorMessage message={formError} /> : null}
        {notice ? <p className="text-center text-xs text-[#8a8a8a]">{notice}</p> : null}

        <Button type="submit" isLoading={isSubmitting} className="mt-1">
          LOGIN
        </Button>
      </form>

      <SocialLoginRow />

      <p className="mt-8 text-center text-sm text-[#9a9a9a]">
        Don&apos;t have account?{" "}
        <Link to="/register" className="font-semibold text-[#222] hover:text-brand">
          Register Now
        </Link>
      </p>
    </AuthLayout>
  );
}
