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

type FamilyValues = { name: string };
type InviteValues = { inviteCode: string };
type FamilyAction =
  | { action: "create"; name: string }
  | { action: "join"; inviteCode: string };

const errorResponseSchema = z.object({ error: z.string().optional() });

function validateFamily(values: FamilyValues, dictionary: Dictionary) {
  const result = z
    .object({
      name: z.string().trim().min(1, dictionary.onboarding.familyNameRequired),
    })
    .safeParse(values);
  if (result.success) return {};
  return result.error.issues.reduce<FormikErrors<FamilyValues>>((errors, issue) => {
    if (issue.path[0] === "name") errors.name = issue.message;
    return errors;
  }, {});
}

function validateInvite(values: InviteValues, dictionary: Dictionary) {
  const result = z
    .object({
      inviteCode: z
        .string()
        .trim()
        .min(1, dictionary.onboarding.inviteCodeRequired),
    })
    .safeParse(values);
  if (result.success) return {};
  return result.error.issues.reduce<FormikErrors<InviteValues>>(
    (errors, issue) => {
      if (issue.path[0] === "inviteCode") errors.inviteCode = issue.message;
      return errors;
    },
    {}
  );
}

async function submitFamilyAction(
  action: FamilyAction,
  dictionary: Dictionary
) {
  const response = await fetch("/api/families", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  if (response.ok) return;

  const data: unknown = await response.json();
  const parsed = errorResponseSchema.safeParse(data);
  throw new Error(
    parsed.success && parsed.data.error
      ? localizeApiError(parsed.data.error, dictionary)
      : dictionary.onboarding.error
  );
}

export default function OnboardingForm({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (action: FamilyAction) =>
      submitFamilyAction(action, dictionary),
    onSuccess: () => {
      router.replace(`/${locale}`);
      router.refresh();
    },
  });
  const createFormik = useFormik<FamilyValues>({
    initialValues: { name: "" },
    validate: (values) => validateFamily(values, dictionary),
    onSubmit: (values) =>
      mutation.mutate({ action: "create", name: values.name.trim() }),
  });
  const joinFormik = useFormik<InviteValues>({
    initialValues: { inviteCode: "" },
    validate: (values) => validateInvite(values, dictionary),
    onSubmit: (values) =>
      mutation.mutate({
        action: "join",
        inviteCode: values.inviteCode.trim(),
      }),
  });

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">
          {dictionary.onboarding.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-0">
        {mutation.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}
        <form
          noValidate
          onSubmit={createFormik.handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-secondary/60 p-4 sm:p-5"
        >
          <h2 className="font-bold">{dictionary.onboarding.createTitle}</h2>
          <div className="space-y-2">
            <Label htmlFor="family-name">{dictionary.onboarding.familyName}</Label>
            <Input
              id="family-name"
              name="name"
              value={createFormik.values.name}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              disabled={mutation.isPending}
              aria-invalid={Boolean(
                createFormik.touched.name && createFormik.errors.name
              )}
            />
            {createFormik.touched.name && createFormik.errors.name && (
              <p className="text-sm text-red-700">{createFormik.errors.name}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending
              ? dictionary.onboarding.creating
              : dictionary.onboarding.create}
          </Button>
        </form>

        <form
          noValidate
          onSubmit={joinFormik.handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          <h2 className="font-bold">{dictionary.onboarding.joinTitle}</h2>
          <div className="space-y-2">
            <Label htmlFor="invite-code">{dictionary.onboarding.inviteCode}</Label>
            <Input
              id="invite-code"
              name="inviteCode"
              dir="ltr"
              value={joinFormik.values.inviteCode}
              onChange={joinFormik.handleChange}
              onBlur={joinFormik.handleBlur}
              disabled={mutation.isPending}
              aria-invalid={Boolean(
                joinFormik.touched.inviteCode && joinFormik.errors.inviteCode
              )}
            />
            {joinFormik.touched.inviteCode && joinFormik.errors.inviteCode && (
              <p className="text-sm text-red-700">
                {joinFormik.errors.inviteCode}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? dictionary.onboarding.joining
              : dictionary.onboarding.join}
          </Button>
        </form>

        <Button
          asChild
          variant="ghost"
          className="w-full"
          disabled={mutation.isPending}
        >
          <Link href={`/${locale}`}>{dictionary.onboarding.skip}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
