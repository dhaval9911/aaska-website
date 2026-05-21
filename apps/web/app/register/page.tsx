import { PageShell } from '@aaska/ui';

import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return (
    <PageShell>
      <AuthForm mode="register" />
    </PageShell>
  );
}
