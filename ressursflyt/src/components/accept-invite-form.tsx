"use client";

import {useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";
import {trpc} from "@/src/trpc/react";

export function AcceptInviteForm({locale}: {locale: string}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const acceptInvite = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      router.push(`/${locale}/dashboard`);
    },
  });

  return (
    <div className="max-w-xl space-y-4 rounded border p-4">
      <h1 className="text-xl font-semibold">Accept invite</h1>
      <div className="space-y-2">
        <label className="block text-sm">Invite token</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste invite token"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-3 py-2" onClick={() => signIn("feide", {callbackUrl: `/${locale}/accept-invite`})}>
          Sign in with Feide
        </button>
        <button className="rounded border px-3 py-2" onClick={() => signIn("idporten", {callbackUrl: `/${locale}/accept-invite`})}>
          Sign in with ID-porten
        </button>
        <button className="rounded border px-3 py-2" onClick={() => signIn("magic-link", {email: prompt("Email") ?? "", callbackUrl: `/${locale}/accept-invite`})}>
          Magic link
        </button>
      </div>
      <button
        className="rounded bg-foreground px-3 py-2 text-background"
        onClick={() => acceptInvite.mutate({token})}
        disabled={acceptInvite.isPending || token.length < 16}
      >
        Accept invite
      </button>
      {acceptInvite.error ? <p className="text-sm text-red-600">{acceptInvite.error.message}</p> : null}
    </div>
  );
}
