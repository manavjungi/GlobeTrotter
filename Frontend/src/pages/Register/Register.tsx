import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout, SocialLoginRow } from "@/components/AuthLayout/AuthLayout";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField } from "@/components/Input/AuthField";
import {
  CameraIcon,
  EnvelopeIcon,
  LockIcon,
  PhoneIcon,
  PinIcon,
  UserIcon,
} from "@/components/Input/icons";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage, getApiFieldErrors } from "@/utils/apiError";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string().min(8, "Enter a valid phone number"),
    countryId: z
      .string()
      .min(1, "Country ID is required")
      .regex(/^\d+$/, "Enter a valid country ID"),
    cityId: z
      .string()
      .min(1, "City ID is required")
      .regex(/^\d+$/, "Enter a valid city ID"),
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
      countryId: "",
      cityId: "",
    },
  });

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: RegisterFormValues) {
    setFormError("");
    try {
      await registerUser({
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone.replace(/\s+/g, ""),
        countryId: Number(values.countryId),
        cityId: Number(values.cityId),
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      const formFields: Array<keyof RegisterFormValues> = [
        "username",
        "firstName",
        "lastName",
        "email",
        "password",
        "phone",
        "countryId",
        "cityId",
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
        <label className="mx-auto mb-1 flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-brand-soft text-[#b0b0b0] transition hover:border-brand hover:text-brand">
          {photoPreview ? (
            <img src={photoPreview} alt="Selected profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1">
              <CameraIcon />
              <span className="text-[10px]">Photo</span>
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        </label>

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
          placeholder="9876543210"
          icon={<PhoneIcon />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField
            label="Country ID"
            type="text"
            inputMode="numeric"
            placeholder="1"
            icon={<PinIcon />}
            error={errors.countryId?.message}
            {...register("countryId")}
          />
          <AuthField
            label="City ID"
            type="text"
            inputMode="numeric"
            placeholder="10"
            icon={<PinIcon />}
            error={errors.cityId?.message}
            {...register("cityId")}
          />
        </div>

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
