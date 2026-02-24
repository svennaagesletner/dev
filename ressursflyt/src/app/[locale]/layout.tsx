import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {AppShell} from "@/src/components/app-shell";
import {routing} from "@/src/i18n/routing";
import {TrpcProvider} from "@/src/trpc/react";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as "nb" | "nn" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TrpcProvider>
        <AppShell locale={locale}>{children}</AppShell>
      </TrpcProvider>
    </NextIntlClientProvider>
  );
}
