import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { cancelInvitation, changeRole, removeMember } from "@/app/actions/team";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { getToken, requireUser } from "@/lib/session";

import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Equipo · RexFy" };

type Role = "owner" | "admin" | "member";

type Team = {
  members: { user_id: string; full_name: string; email: string; role: Role }[];
  invitations: { id: string; email: string; role: Role; created_at: string }[];
};

const ROLES: Record<Role, string> = {
  owner: "Dueño",
  admin: "Admin",
  member: "Miembro",
};

export default function TeamPage({ params }: PageProps<"/panel/equipo/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
        <Suspense fallback={<p className="text-muted">Cargando…</p>}>
          <TeamView params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function TeamView({ params }: { params: Promise<{ id: string }> }) {
  const [me, { id }] = await Promise.all([requireUser(), params]);
  const company = me.companies.find((c) => c.company_id === id);
  if (!company) notFound();
  const result = await apiFetch<Team>(
    `/companies/${encodeURIComponent(id)}/team`,
    { token: await getToken() },
  );
  if (!result.ok) return <p className="text-warn">{result.message}</p>;
  const canManage = company.role === "owner" || company.role === "admin";

  return (
    <>
      <PageHeader
        eyebrow={company.legal_name}
        title="Equipo"
        description="Los miembros publican, negocian y piden transporte. El dueño y los admins además aceptan cotizaciones, eligen transportador, cierran órdenes y manejan el equipo."
        actions={
          <Link href="/panel" className="btn btn-secondary">
            Volver al panel
          </Link>
        }
      />
      <ul className="divide-y divide-border card">
        {result.data.members.map((m) => {
          const isMe = m.email === me.email;
          return (
            <li
              key={m.user_id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {m.full_name}
                  {isMe && <span className="text-muted"> (tú)</span>}
                </p>
                <p className="text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {canManage && m.role !== "owner" && !isMe ? (
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="company_id" value={id} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <input
                      type="hidden"
                      name="role"
                      value={m.role === "admin" ? "member" : "admin"}
                    />
                    <span className="chip">{ROLES[m.role]}</span>
                    <button className="text-muted underline hover:text-foreground">
                      {m.role === "admin" ? "Hacer miembro" : "Hacer admin"}
                    </button>
                  </form>
                ) : (
                  <span className="chip">{ROLES[m.role]}</span>
                )}
                {m.role !== "owner" && (canManage || isMe) && (
                  <form action={removeMember}>
                    <input type="hidden" name="company_id" value={id} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <input type="hidden" name="self" value={String(isMe)} />
                    <button className="text-muted underline hover:text-warn">
                      {isMe ? "Salir" : "Quitar"}
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
        {result.data.invitations.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">{i.email}</p>
              <p className="text-muted">
                Invitación pendiente · {ROLES[i.role]}
              </p>
            </div>
            {canManage && (
              <form action={cancelInvitation}>
                <input type="hidden" name="company_id" value={id} />
                <input type="hidden" name="invitation_id" value={i.id} />
                <button className="text-muted underline hover:text-warn">
                  Cancelar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {canManage && <InviteForm companyId={id} />}
    </>
  );
}
