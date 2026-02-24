import {redirect} from "next/navigation";
import {auth} from "@/src/auth";
import {prisma} from "@/src/server/prisma";
import {AdminRoles} from "@/src/components/admin-roles";

export default async function AdminRolesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/accept-invite`);
  }

  const hasMembership = await prisma.membership.count({where: {userId: session.user.id}});
  if (!hasMembership) {
    redirect(`/${locale}/no-access`);
  }

  return <AdminRoles />;
}
