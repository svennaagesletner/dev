import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";
import { TRPCError } from "@trpc/server";
import { getEffectivePermissionCodes } from "@/src/server/auth/rbac";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.municipalityId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No municipality membership" });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      municipalityId: ctx.municipalityId,
    },
  });
});

export const permissionProcedure = (permissionCode: string) =>
  protectedProcedure.use(async ({ ctx, input, next }) => {
    const inputRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : null;
    const schoolId = typeof inputRecord?.schoolId === "string" ? inputRecord.schoolId : null;

    const effectiveCodes = await getEffectivePermissionCodes(ctx.userId, ctx.municipalityId, schoolId);
    if (!effectiveCodes.has(permissionCode)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Missing permission: ${permissionCode}` });
    }

    return next();
  });
