import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/nodemailer";
import {z} from "zod";
import {prisma} from "@/src/server/prisma";
import {verifyPassword} from "@/src/server/auth/password";
import {AuthProvider} from "@prisma/client";
import {resolvePreferredLocale} from "@/src/server/auth/session";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {strategy: "database"},
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/nb/accept-invite",
  },
  providers: [
    ...(process.env.FEIDE_CLIENT_ID && process.env.FEIDE_CLIENT_SECRET && process.env.FEIDE_ISSUER
      ? [
          {
            id: "feide",
            name: "Feide",
            type: "oidc",
            issuer: process.env.FEIDE_ISSUER,
            clientId: process.env.FEIDE_CLIENT_ID,
            clientSecret: process.env.FEIDE_CLIENT_SECRET,
            checks: ["pkce", "state"],
          } as any,
        ]
      : []),
    ...(process.env.IDPORTEN_CLIENT_ID && process.env.IDPORTEN_CLIENT_SECRET && process.env.IDPORTEN_ISSUER
      ? [
          {
            id: "idporten",
            name: "ID-porten",
            type: "oidc",
            issuer: process.env.IDPORTEN_ISSUER,
            clientId: process.env.IDPORTEN_CLIENT_ID,
            clientSecret: process.env.IDPORTEN_CLIENT_SECRET,
            checks: ["pkce", "state"],
          } as any,
        ]
      : []),
    ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
      ? [
          Email({
            id: "magic-link",
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
    Credentials({
      id: "local-password",
      name: "Local account",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {email: parsed.data.email},
          include: {passwordCredential: true},
        });

        if (!user?.passwordCredential) {
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordCredential.passwordHash);
        if (!valid) {
          return null;
        }

        await prisma.accountIdentity.upsert({
          where: {
            provider_providerSubject: {
              provider: AuthProvider.LOCAL_PASSWORD,
              providerSubject: user.id,
            },
          },
          create: {
            userId: user.id,
            provider: AuthProvider.LOCAL_PASSWORD,
            providerSubject: user.id,
            email: user.email,
            lastLoginAt: new Date(),
          },
          update: {
            email: user.email,
            lastLoginAt: new Date(),
          },
        });

        return {id: user.id, email: user.email, name: user.name};
      },
    }),
  ],
  callbacks: {
    async session({session, user}) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({url, baseUrl}) {
      if (url.startsWith(baseUrl) && new URL(url).pathname === "/") {
        return `${baseUrl}/nb/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  events: {
    async signIn({user, account, profile}) {
      if (!account?.provider || !user.id) {
        return;
      }

      const providerMap: Record<string, AuthProvider | undefined> = {
        feide: AuthProvider.FEIDE,
        idporten: AuthProvider.IDPORTEN,
        "magic-link": AuthProvider.LOCAL_MAGICLINK,
        "local-password": AuthProvider.LOCAL_PASSWORD,
      };

      const provider = providerMap[account.provider];
      if (!provider) {
        return;
      }

      const profileEmail = typeof profile?.email === "string" ? profile.email : user.email;

      await prisma.accountIdentity.upsert({
        where: {
          provider_providerSubject: {
            provider,
            providerSubject: String(account.providerAccountId ?? user.id),
          },
        },
        create: {
          userId: user.id,
          provider,
          providerSubject: String(account.providerAccountId ?? user.id),
          email: profileEmail,
          lastLoginAt: new Date(),
        },
        update: {
          email: profileEmail,
          lastLoginAt: new Date(),
        },
      });

      const preferredLocale = await resolvePreferredLocale(user.id);
      await prisma.user.update({
        where: {id: user.id},
        data: {localeOverride: preferredLocale},
      });
    },
  },
});
