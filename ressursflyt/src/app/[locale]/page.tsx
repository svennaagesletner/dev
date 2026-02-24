import Link from "next/link";

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ressursflyt</h1>
      <p>Municipality and school resource planning with invite-only onboarding and RBAC.</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="rounded border px-3 py-2" href={`/${locale}/dashboard`}>
          Dashboard
        </Link>
        <Link className="rounded border px-3 py-2" href={`/${locale}/accept-invite`}>
          Accept invite
        </Link>
      </div>
    </div>
  );
}
