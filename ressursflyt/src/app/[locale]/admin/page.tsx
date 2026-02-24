import Link from "next/link";

export default async function AdminHomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="flex flex-wrap gap-2">
        <Link className="rounded border px-3 py-2" href={`/${locale}/admin/roles`}>
          Roles
        </Link>
        <Link className="rounded border px-3 py-2" href={`/${locale}/admin/invites`}>
          Invites
        </Link>
        <Link className="rounded border px-3 py-2" href={`/${locale}/admin/years`}>
          Academic years
        </Link>
      </div>
    </div>
  );
}
