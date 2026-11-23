"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { type FormikErrors, useFormik } from "formik";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizeApiError } from "@/i18n/errors";

type RegisterValues = { name: string; email: string; password: string };
const errorResponseSchema = z.object({ error: z.string().optional() });

function createSchema(dictionary: Dictionary) {
  return z.object({
    name: z.string().trim().min(1, dictionary.register.nameRequired),
    email: z
      .string()
      .trim()
      .min(1, dictionary.register.emailRequired)
      .email(dictionary.register.emailInvalid),
    password: z
      .string()
      .min(1, dictionary.register.passwordRequired)
      .min(8, dictionary.register.passwordMin),
  });
}

function validate(values: RegisterValues, dictionary: Dictionary) {
  const result = createSchema(dictionary).safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<FormikErrors<RegisterValues>>(
    (errors, issue) => {
      const field = issue.path[0];
      if (
        (field === "name" || field === "email" || field === "password") &&
        !errors[field]
      ) {
        errors[field] = issue.message;
      }
      return errors;
    },
    {}
  );
}

async function submitRegistration(
  values: RegisterValues,
  dictionary: Dictionary
) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (response.ok) return;

  const data: unknown = await response.json();
  const parsed = errorResponseSchema.safeParse(data);
  throw new Error(
    parsed.success && parsed.data.error
      ? localizeApiError(parsed.data.error, dictionary)
      : dictionary.dashboard.errors.register
  );
}

export default function RegisterForm({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      submitRegistration(values, dictionary),
    onSuccess: () => {
      router.replace(`/${locale}/onboarding`);
      router.refresh();
    },
  });
  const formik = useFormik<RegisterValues>({
    initialValues: { name: "", email: "", password: "" },
    validate: (values) => validate(values, dictionary),
    onSubmit: (values) =>
      mutation.mutate({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
      }),
  });
  const disabled = mutation.isPending;

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">
          {dictionary.register.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form noValidate onSubmit={formik.handleSubmit} className="space-y-4">
          {mutation.isError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{dictionary.register.name}</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={disabled}
              aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-sm text-red-700">{formik.errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{dictionary.register.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={disabled}
              aria-invalid={Boolean(
                formik.touched.email && formik.errors.email
              )}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-700">{formik.errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{dictionary.register.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={disabled}
              aria-invalid={Boolean(
                formik.touched.password && formik.errors.password
              )}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-sm text-red-700">
                {formik.errors.password}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={disabled}>
            {disabled ? dictionary.register.submitting : dictionary.register.submit}
          </Button>
          <Button asChild variant="link" className="w-full">
            <Link href={`/${locale}/login`}>{dictionary.register.loginLink}</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
