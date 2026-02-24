"use client";

import {FormEvent, useState} from "react";
import {trpc} from "@/src/trpc/react";

export function AdminYears() {
  const utils = trpc.useUtils();
  const years = trpc.academicYear.list.useQuery();
  const [templateYearId, setTemplateYearId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const create = trpc.academicYear.createFromTemplate.useMutation({
    onSuccess: async () => {
      await utils.academicYear.list.invalidate();
    },
  });

  const lockYear = trpc.academicYear.lock.useMutation({
    onSuccess: async () => {
      await utils.academicYear.list.invalidate();
    },
  });

  const unlockYear = trpc.academicYear.unlock.useMutation({
    onSuccess: async () => {
      await utils.academicYear.list.invalidate();
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({templateYearId, name, startDate, endDate});
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Academic years</h1>
      <form className="space-y-3 rounded border p-4" onSubmit={onSubmit}>
        <h2 className="font-medium">Create from template</h2>
        <select className="w-full rounded border px-3 py-2" value={templateYearId} onChange={(event) => setTemplateYearId(event.target.value)}>
          <option value="">Select template year</option>
          {(years.data ?? []).map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
        <input className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <button className="rounded bg-foreground px-3 py-2 text-background" disabled={create.isPending || !templateYearId}>
          Create year
        </button>
      </form>
      <div className="space-y-2">
        {(years.data ?? []).map((year) => (
          <div key={year.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">{year.name}</p>
              <p className="text-sm text-foreground/70">{year.status}</p>
            </div>
            <div className="flex gap-2">
              {year.status !== "LOCKED" ? (
                <button className="rounded border px-3 py-2" onClick={() => lockYear.mutate({academicYearId: year.id})}>
                  Lock
                </button>
              ) : (
                <button className="rounded border px-3 py-2" onClick={() => unlockYear.mutate({academicYearId: year.id})}>
                  Unlock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
