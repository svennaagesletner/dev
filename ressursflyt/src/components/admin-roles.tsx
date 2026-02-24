"use client";

import {FormEvent, useMemo, useState} from "react";
import {trpc} from "@/src/trpc/react";

export function AdminRoles() {
  const utils = trpc.useUtils();
  const rolesQuery = trpc.rbac.listRoles.useQuery();
  const permissionsQuery = trpc.rbac.listPermissions.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createRole = trpc.rbac.createRole.useMutation({
    onSuccess: async () => {
      setName("");
      setDescription("");
      await utils.rbac.listRoles.invalidate();
    },
  });

  const setRolePermissions = trpc.rbac.setRolePermissions.useMutation({
    onSuccess: async () => {
      await utils.rbac.listRoles.invalidate();
    },
  });

  const groupedPermissions = useMemo(() => {
    const grouped = new Map<string, typeof permissionsQuery.data>();
    for (const permission of permissionsQuery.data ?? []) {
      const existing = grouped.get(permission.resource) ?? [];
      grouped.set(permission.resource, [...existing, permission]);
    }
    return grouped;
  }, [permissionsQuery]);

  const handleCreateRole = (event: FormEvent) => {
    event.preventDefault();
    createRole.mutate({name, description});
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Roles</h1>
      <form className="space-y-2 rounded border p-4" onSubmit={handleCreateRole}>
        <h2 className="font-medium">Create role</h2>
        <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" />
        <input className="w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button className="rounded bg-foreground px-3 py-2 text-background" disabled={createRole.isPending}>
          Create
        </button>
      </form>

      {(rolesQuery.data ?? []).map((role) => {
        const selectedIds = new Set(role.rolePermissions.map((rp) => rp.permissionId));
        return (
          <div key={role.id} className="space-y-2 rounded border p-4">
            <h2 className="font-medium">{role.name}</h2>
            <p className="text-sm text-foreground/70">{role.description}</p>
            {[...groupedPermissions.entries()].map(([resource, permissions]) => (
              <div key={resource}>
                <h3 className="text-sm font-medium">{resource}</h3>
                <div className="grid gap-1 md:grid-cols-2">
                  {(permissions ?? []).map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(permission.id)}
                        onChange={(event) => {
                          const nextIds = new Set(selectedIds);
                          if (event.target.checked) {
                            nextIds.add(permission.id);
                          } else {
                            nextIds.delete(permission.id);
                          }
                          setRolePermissions.mutate({
                            roleId: role.id,
                            permissionIds: [...nextIds],
                          });
                        }}
                      />
                      {permission.code}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
