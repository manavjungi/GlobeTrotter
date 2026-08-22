import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout, SocialLoginRow } from "@/components/AuthLayout/AuthLayout";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import {
  CameraIcon,
  EnvelopeIcon,
  LockIcon,
  PhoneIcon,
  PinIcon,
  UserIcon,
} from "@/components/Input/icons";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/utils/apiError";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone: z.string().min(8, "Enter a valid phone number"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    additional_information: z.string().optional(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      city: "",
      country: "",
      additional_information: "",
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
    setNotice("");
    try {
      await registerUser({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        city: values.city,
        country: values.country,
        additional_information: values.additional_information?.trim()
          ? values.additional_information
          : undefined,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField
            label="First Name"
            autoComplete="given-name"
            placeholder="Aarav"
            icon={<UserIcon />}
            error={errors.first_name?.message}
            {...register("first_name")}
          />
          <AuthField
            label="Last Name"
            autoComplete="family-name"
            placeholder="Sharma"
            icon={<UserIcon />}
            error={errors.last_name?.message}
            {...register("last_name")}
          />
        </div>

        <AuthField
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="thisuix@mail.com"
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
            error={errors.confirm_password?.message}
            {...register("confirm_password")}
          />
        </div>

        <AuthField
          label="Phone Number"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          icon={<PhoneIcon />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField
            label="City"
            autoComplete="address-level2"
            placeholder="Mumbai"
            icon={<PinIcon />}
            error={errors.city?.message}
            {...register("city")}
          />
          <AuthField
            label="Country"
            autoComplete="country-name"
            placeholder="India"
            icon={<PinIcon />}
            error={errors.country?.message}
            {...register("country")}
          />
        </div>

        <AuthTextArea
          label="Additional Information"
          rows={3}
          placeholder="Tell us about the trips you love..."
          error={errors.additional_information?.message}
          {...register("additional_information")}
        />

        {formError ? <ErrorMessage message={formError} /> : null}
        {notice ? <p className="text-center text-xs text-[#8a8a8a]">{notice}</p> : null}

        <Button type="submit" isLoading={isSubmitting} className="mt-1">
          REGISTER
        </Button>
      </form>

      <SocialLoginRow
        onUnavailable={(provider) =>
          setNotice(`${provider} login is not available yet. Please use email instead.`)
        }
      />

      <p className="mt-6 text-center text-sm text-[#9a9a9a]">
        Already have account?{" "}
        <Link to="/login" className="font-semibold text-[#222] hover:text-brand">
          Login Now
        </Link>
      </p>
    </AuthLayout>
  );
}
