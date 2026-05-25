'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Card, Input } from '@aaska/ui';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  whatsappNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.')
    .optional()
    .or(z.literal('')),
});

type AuthMode = 'login' | 'register';
type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
  whatsappNumber?: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === 'login';
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isLogin ? {} : { name: '', whatsappNumber: '' }),
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);

    if (isLogin) {
      const result = await signIn('credentials', {
        ...values,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        return;
      }

      // Merge any guest cart into the user's cart (best-effort, non-blocking)
      try {
        const sessionId =
          typeof window !== 'undefined' ? localStorage.getItem('cart_session') : null;
        if (sessionId) {
          const { getSession } = await import('next-auth/react');
          const freshSession = await getSession();
          const token = (freshSession as { accessToken?: string } | null)?.accessToken;
          if (token) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
            await fetch(`${apiUrl}/cart/merge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-cart-session': sessionId,
              },
            });
          }
        }
      } catch {
        // Non-critical — never block login on cart merge failure
      }

      router.push('/');
      router.refresh();
      return;
    }

    // Registration flow
    const { whatsappNumber, ...rest } = values;
    const registerPayload = {
      ...rest,
      ...(whatsappNumber ? { whatsappNumber } : {}),
    };
    const response = await fetch('/api/proxy/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(
        (body as { message?: string }).message ?? 'Unable to create your account right now.',
      );
      return;
    }

    const signInResult = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError('Account created. Please sign in.');
      router.push('/login');
      return;
    }

    router.push('/');
    router.refresh();
  });

  return (
    <Card className="mx-auto max-w-lg">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </p>
        <h1 className="text-3xl font-bold text-stone-900">
          {isLogin ? 'Sign in to Aaska' : 'Start building your Aaska profile'}
        </h1>
        <p className="text-sm text-stone-600">
          {isLogin
            ? 'Use your email and password to sign in.'
            : 'Create an account to browse orders and manage your wishlist.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {!isLogin ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Name</span>
              <Input {...form.register('name')} placeholder="Your name" />
              {form.formState.errors.name ? (
                <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                WhatsApp number <span className="font-normal text-stone-400">(optional)</span>
              </span>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-500">
                  +91
                </span>
                <Input
                  {...form.register('whatsappNumber')}
                  placeholder="9876543210"
                  inputMode="numeric"
                  className="rounded-l-none"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    form.setValue('whatsappNumber', digits, { shouldValidate: true });
                  }}
                />
              </div>
              {form.formState.errors.whatsappNumber ? (
                <span className="text-xs text-red-600">
                  {form.formState.errors.whatsappNumber.message}
                </span>
              ) : (
                <p className="text-xs text-stone-400">
                  Pre-fills your WhatsApp at checkout so you don't have to type it again.
                </p>
              )}
            </label>
          </>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <Input {...form.register('email')} placeholder="you@example.com" type="email" />
          {form.formState.errors.email ? (
            <span className="text-xs text-red-600">{form.formState.errors.email.message}</span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <Input
            {...form.register('password')}
            placeholder="Minimum 8 characters"
            type="password"
          />
          {form.formState.errors.password ? (
            <span className="text-xs text-red-600">{form.formState.errors.password.message}</span>
          ) : null}
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        {isLogin ? 'Need an account?' : 'Already registered?'}{' '}
        <Link
          className="font-semibold text-bark underline underline-offset-4"
          href={isLogin ? '/register' : '/login'}
        >
          {isLogin ? 'Register here' : 'Sign in'}
        </Link>
      </p>
    </Card>
  );
}
