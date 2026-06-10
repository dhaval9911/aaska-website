import type { Metadata } from 'next';

import { PageShell } from '@aaska/ui';

import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Create Account | Resin Dreams',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <PageShell>
      <AuthForm mode="register" />
    </PageShell>
  );
}
