import {redirect} from "next/navigation";
import {auth} from "@/src/auth";
import {prisma} from "@/src/server/prisma";
import {SchoolOverview} from "@/src/components/school-overview";

export default async function SchoolOverviewPage({
  params,
}: {
  params: Promise<{locale: string; schoolId: string; academicYearId: string}>;
}) {
  const {locale, schoolId, academicYearId} = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/accept-invite`);
  }

  const hasMembership = await prisma.membership.count({where: {userId: session.user.id}});
  if (!hasMembership) {
    redirect(`/${locale}/no-access`);
  }

  return <SchoolOverview schoolId={schoolId} yearId={academicYearId} />;
}
