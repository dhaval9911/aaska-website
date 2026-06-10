import type { Metadata } from 'next';

import { PageShell } from '@aaska/ui';

import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Login | Resin Dreams',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <PageShell>
      <AuthForm mode="login" />
    </PageShell>
  );
}
