"use client";

import { useActionState } from "react";

import { inviteMember } from "@/app/actions/team";
import { FormMessage, SubmitButton } from "@/components/form";

export function InviteForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(inviteMember, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 card p-5">
      <h2 className="text-lg font-bold">Invitar a alguien</h2>
      <input type="hidden" name="company_id" value={companyId} />
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="persona@empresa.com"
          className="input min-w-0 flex-1 text-base"
        />
        <select name="role" defaultValue="member" className="input text-base">
          <option value="member">Miembro</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <p className="text-xs text-muted">
        Si ya tiene cuenta en RexFy entra de una vez; si no, cuando se registre
        con ese email.
      </p>
      <FormMessage message={state?.message} />
      {state?.done && (
        <p role="status" className="text-sm text-brand">
          Listo, le avisamos por email.
        </p>
      )}
      <div>
        <SubmitButton pending={pending}>Invitar</SubmitButton>
      </div>
    </form>
  );
}
