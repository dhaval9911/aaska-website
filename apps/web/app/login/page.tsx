import { PageShell } from '@aaska/ui';

import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <PageShell>
      <AuthForm mode="login" />
    </PageShell>
  );
}
