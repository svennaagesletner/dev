import {AcceptInviteForm} from "@/src/components/accept-invite-form";

export default async function AcceptInvitePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return <AcceptInviteForm locale={locale} />;
}
