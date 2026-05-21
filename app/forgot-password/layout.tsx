import { Suspense } from 'react';

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>{children}</Suspense>;
}
