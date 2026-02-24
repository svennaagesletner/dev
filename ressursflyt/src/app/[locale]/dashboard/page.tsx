import Link from "next/link";
import {redirect} from "next/navigation";
import {auth} from "@/src/auth";
import {prisma} from "@/src/server/prisma";

export default async function DashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/accept-invite`);
  }

  const memberships = await prisma.membership.findMany({
    where: {userId: session.user.id},
    include: {school: true, municipality: true},
  });

  if (memberships.length === 0) {
    redirect(`/${locale}/no-access`);
  }

  const municipalityId = memberships[0].municipalityId;
  const years = await prisma.academicYear.findMany({
    where: {municipalityId},
    orderBy: {startDate: "desc"},
  });
  const firstYearId = years[0]?.id;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-foreground/75">Signed in as {session.user.email}</p>
      <div className="rounded border p-4">
        <h2 className="font-medium">Memberships</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {memberships.map((membership) => (
            <li key={membership.id}>
              {membership.municipality.name} {membership.school ? `• ${membership.school.name}` : "• Municipality scope"}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        {memberships
          .filter((membership) => membership.schoolId)
          .map((membership) => (
            <Link
              key={membership.id}
              className="rounded border px-3 py-2"
              href={`/${locale}/school/${membership.schoolId}/year/${firstYearId ?? ""}/overview`}
            >
              Open {membership.school?.name}
            </Link>
          ))}
      </div>
    </div>
  );
}
