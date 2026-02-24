"use client";

import {FormEvent, useMemo, useState} from "react";
import {trpc} from "@/src/trpc/react";

export function AdminInvites() {
  const utils = trpc.useUtils();
  const roles = trpc.rbac.listRoles.useQuery();
  const schools = trpc.school.listSchoolsForUser.useQuery();
  const invites = trpc.invites.list.useQuery();

  const [roleId, setRoleId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [latestToken, setLatestToken] = useState<string | null>(null);

  const createInvite = trpc.invites.create.useMutation({
    onSuccess: async (result) => {
      setLatestToken(result.token);
      await utils.invites.list.invalidate();
    },
  });

  const revokeInvite = trpc.invites.revoke.useMutation({
    onSuccess: async () => {
      await utils.invites.list.invalidate();
    },
  });

  const canSubmit = useMemo(() => roleId.length > 0 && expiresAt.length > 0, [roleId, expiresAt]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createInvite.mutate({
      roleId,
      schoolId: schoolId || undefined,
      email: email || undefined,
      expiresAt,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invites</h1>
      <form className="space-y-3 rounded border p-4" onSubmit={onSubmit}>
        <h2 className="font-medium">Create invite</h2>
        <select className="w-full rounded border px-3 py-2" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <option value="">Select role</option>
          {(roles.data ?? []).map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
          <option value="">Municipality scope</option>
          {(schools.data ?? []).map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
        <input className="w-full rounded border px-3 py-2" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        <button className="rounded bg-foreground px-3 py-2 text-background" disabled={!canSubmit || createInvite.isPending}>
          Create invite
        </button>
        {latestToken ? <p className="rounded border border-amber-400 bg-amber-100 p-2 text-sm">Token (shown once): {latestToken}</p> : null}
      </form>

      <div className="space-y-2">
        {(invites.data ?? []).map((invite) => (
          <div key={invite.id} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <p>{invite.role.name}</p>
              <p className="text-foreground/70">{invite.school?.name ?? "Municipality scope"} • {invite.status}</p>
            </div>
            {invite.status === "PENDING" ? (
              <button className="rounded border px-3 py-2" onClick={() => revokeInvite.mutate({inviteId: invite.id})}>
                Revoke
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
