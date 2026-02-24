import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const safeLocale: "nb" | "nn" | "en" = routing.locales.includes(locale as "nb" | "nn" | "en")
    ? (locale as "nb" | "nn" | "en")
    : routing.defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
  };
});
