import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nb", "nn", "en"],
  defaultLocale: "nb",
  localePrefix: "always",
});
