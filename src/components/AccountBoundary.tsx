import type { ReactNode } from 'react';

// A changed key discards all private React state and old async state setters.
export function AccountBoundary({ userId, children }: { userId: string | null; children: ReactNode }) {
  return <AccountContent key={userId ?? 'signed-out'}>{children}</AccountContent>;
}

function AccountContent({ children }: { children: ReactNode }) {
  return children;
}
