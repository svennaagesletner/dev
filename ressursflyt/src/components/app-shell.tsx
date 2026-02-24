import Link from "next/link";

export function AppShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/${locale}`} className="font-semibold">
            Ressursflyt
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href={`/${locale}/dashboard`}>Dashboard</Link>
            <Link href={`/${locale}/admin/roles`}>Roles</Link>
            <Link href={`/${locale}/admin/invites`}>Invites</Link>
            <Link href={`/${locale}/admin/years`}>Years</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
