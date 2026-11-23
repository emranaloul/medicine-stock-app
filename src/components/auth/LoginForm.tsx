'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormikErrors, useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { localizeApiError } from '@/i18n/errors';

const SESSION_QUERY_KEY = ['auth', 'current-user'] as const;

const sessionResponseSchema = z.object({
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .nullable(),
});

const loginResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string().optional(),
});

type LoginFormValues = {
  email: string;
  password: string;
};

async function fetchCurrentSession(dictionary: Dictionary) {
  const response = await fetch('/api/auth/me', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(dictionary.login.sessionUnavailable);
  }

  const data: unknown = await response.json();
  return sessionResponseSchema.parse(data);
}

async function submitLogin(values: LoginFormValues, dictionary: Dictionary) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    const errorResponse = errorResponseSchema.safeParse(data);
    throw new Error(
      errorResponse.success && errorResponse.data.error
        ? localizeApiError(errorResponse.data.error, dictionary)
        : dictionary.dashboard.errors.login,
    );
  }

  const loginResponse = loginResponseSchema.safeParse(data);
  if (!loginResponse.success) {
    throw new Error(dictionary.dashboard.errors.login);
  }

  return loginResponse.data;
}

function validateLogin(values: LoginFormValues, dictionary: Dictionary) {
  const loginSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, dictionary.login.emailRequired)
      .email(dictionary.login.emailInvalid),
    password: z.string().min(1, dictionary.login.passwordRequired),
  });
  const result = loginSchema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<FormikErrors<LoginFormValues>>(
    (errors, issue) => {
      const field = issue.path[0];
      if (field === 'email' && !errors.email) errors.email = issue.message;
      if (field === 'password' && !errors.password)
        errors.password = issue.message;
      return errors;
    },
    {},
  );
}

export default function LoginForm({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => fetchCurrentSession(dictionary),
    retry: false,
  });
  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => submitLogin(values, dictionary),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      router.replace(`/${locale}`);
      router.refresh();
    },
  });
  const formik = useFormik<LoginFormValues>({
    initialValues: { email: '', password: '' },
    validate: (values) => validateLogin(values, dictionary),
    onSubmit: (values, { setSubmitting }) => {
      loginMutation.mutate(
        {
          email: values.email.trim(),
          password: values.password,
        },
        {
          onSettled: () => setSubmitting(false),
        },
      );
    },
  });

  useEffect(() => {
    if (sessionQuery.data?.user) router.replace(`/${locale}`);
  }, [locale, router, sessionQuery.data?.user]);

  const isSubmitting = formik.isSubmitting || loginMutation.isPending;

  return (
    <Card className='w-full border-0 bg-transparent shadow-none'>
      <CardHeader className='p-0 pb-6'>
        <CardTitle className='text-2xl font-bold text-foreground'>
          {dictionary.login.title}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <form noValidate onSubmit={formik.handleSubmit} className='space-y-4'>
          {sessionQuery.isPending && (
            <p role='status' className='text-sm text-muted-foreground'>
              {dictionary.login.checkingSession}
            </p>
          )}
          {sessionQuery.isError && (
            <Alert variant='default'>
              <AlertDescription>
                {dictionary.login.sessionUnavailable}
              </AlertDescription>
            </Alert>
          )}
          {loginMutation.isError && (
            <Alert variant='destructive' role='alert'>
              <AlertDescription>
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : dictionary.dashboard.errors.login}
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>{dictionary.login.email}</Label>
            <Input
              id='email'
              name='email'
              type='email'
              dir='ltr'
              autoComplete='email'
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                formik.touched.email && formik.errors.email,
              )}
              aria-describedby={
                formik.touched.email && formik.errors.email
                  ? 'email-error'
                  : undefined
              }
            />
            {formik.touched.email && formik.errors.email && (
              <p id='email-error' className='text-sm text-red-700'>
                {formik.errors.email}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>{dictionary.login.password}</Label>
            <Input
              id='password'
              name='password'
              type='password'
              dir='ltr'
              autoComplete='current-password'
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                formik.touched.password && formik.errors.password,
              )}
              aria-describedby={
                formik.touched.password && formik.errors.password
                  ? 'password-error'
                  : undefined
              }
            />
            {formik.touched.password && formik.errors.password && (
              <p id='password-error' className='text-sm text-red-700'>
                {formik.errors.password}
              </p>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span
                  aria-hidden='true'
                  className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'
                />
                {dictionary.login.submitting}
              </>
            ) : (
              dictionary.login.submit
            )}
          </Button>
          <Button asChild variant='link' className='w-full'>
            <Link href={`/${locale}/register`}>
              {dictionary.login.registerLink}
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
