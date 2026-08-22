import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout, SocialLoginRow } from "@/components/AuthLayout/AuthLayout";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField } from "@/components/Input/AuthField";
import { EnvelopeIcon, LockIcon, PhoneIcon, UserIcon } from "@/components/Input/icons";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage, getApiFieldErrors } from "@/utils/apiError";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string(),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError("");
    const lastName = values.lastName.trim();
    const phone = values.phone.replace(/\s+/g, "");

    try {
      await registerUser({
        username: values.username,
        firstName: values.firstName,
        email: values.email,
        password: values.password,
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
      });
      navigate("/login", { replace: true, state: { notice: "Account created. Please log in." } });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      const formFields: Array<keyof RegisterFormValues> = [
        "username",
        "firstName",
        "lastName",
        "email",
        "password",
        "phone",
      ];

      for (const field of formFields) {
        const message = fieldErrors[field];
        if (message) {
          setError(field, { type: "server", message });
        }
      }

      setFormError(getApiErrorMessage(error));
    }
  }

  return (
    <AuthLayout title="Welcome" subtitle="Register with Email">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          label="Username"
          autoComplete="username"
          placeholder="john_doe"
          icon={<UserIcon />}
          error={errors.username?.message}
          {...register("username")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField
            label="First Name"
            autoComplete="given-name"
            placeholder="John"
            icon={<UserIcon />}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthField
            label="Last Name"
            autoComplete="family-name"
            placeholder="Doe"
            icon={<UserIcon />}
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <AuthField
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="john@example.com"
          icon={<EnvelopeIcon />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="***********"
            icon={<LockIcon />}
            error={errors.password?.message}
            {...register("password")}
          />
          <AuthField
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="***********"
            icon={<LockIcon />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <AuthField
          label="Phone Number"
          type="tel"
          autoComplete="tel"
          placeholder="Optional"
          icon={<PhoneIcon />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        {formError ? <ErrorMessage message={formError} /> : null}

        <Button type="submit" isLoading={isSubmitting} className="mt-1">
          REGISTER
        </Button>
      </form>

      <SocialLoginRow />

      <p className="mt-6 text-center text-sm text-[#9a9a9a]">
        Already have account?{" "}
        <Link to="/login" className="font-semibold text-[#222] hover:text-brand">
          Login Now
        </Link>
      </p>
    </AuthLayout>
  );
}
