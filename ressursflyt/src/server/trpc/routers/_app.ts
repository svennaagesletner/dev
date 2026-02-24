import {authRouter} from "@/src/server/trpc/routers/auth";
import {academicYearRouter} from "@/src/server/trpc/routers/academic-year";
import {invitesRouter} from "@/src/server/trpc/routers/invites";
import {rbacRouter} from "@/src/server/trpc/routers/rbac";
import {schoolRouter} from "@/src/server/trpc/routers/school";
import {publicProcedure, router} from "@/src/server/trpc/trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ok: true})),
  auth: authRouter,
  rbac: rbacRouter,
  invites: invitesRouter,
  academicYear: academicYearRouter,
  school: schoolRouter,
});

export type AppRouter = typeof appRouter;
