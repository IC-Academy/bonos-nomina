"use client";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useApi } from "../../api/provider";
import { initials } from "../../domain/format";
import { ROLES, type AppUser, type Role } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { useResource } from "../../hooks/useResource";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Card, Head } from "../../components/shared/ui";

export function AdminView() {
  const api = useApi();
  const { can } = useSession();
  const { notifyError } = useWorkspace();
  const users = useResource(() => api.admin.listUsers(), "admin-users");
  const add = useMutation((displayName: string) => api.admin.addUser({ displayName, role: "Usuario" }));
  const update = useMutation((id: string, role: Role) => api.admin.updateRole(id, role));
  const remove = useMutation((id: string) => api.admin.removeUser(id));
  const editable = can("usuarios.administrar");
  const busy = add.pending || update.pending || remove.pending;

  return (
    <section className="screen">
      <Head title="Administración" text="El Super Admin puede agregar usuarios, cambiar roles o retirar accesos desde este panel." />
      <div className="grid2">
        <Card title="Usuarios">
          <AsyncView resource={users} label="Cargando usuarios…" compact>
            {(list) => (
              <>
                {editable && (
                  <button
                    className="add-user"
                    disabled={busy}
                    onClick={async () => {
                      const r = await add.run(`Usuario ABM ${String(list.length).padStart(2, "0")}`);
                      if (!r.ok) return notifyError(r.error);
                      users.setData((c) => [...(c ?? []), r.data]);
                    }}
                  >
                    <UserPlus /> Agregar usuario
                  </button>
                )}
                {list.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    editable={editable}
                    disabled={busy}
                    onRole={async (role) => {
                      const r = await update.run(user.id, role);
                      if (!r.ok) return notifyError(r.error);
                      users.setData((c) => c?.map((u) => (u.id === user.id ? r.data : u)));
                    }}
                    onRemove={async () => {
                      const r = await remove.run(user.id);
                      if (!r.ok) return notifyError(r.error);
                      users.setData((c) => c?.filter((u) => u.id !== user.id));
                    }}
                  />
                ))}
              </>
            )}
          </AsyncView>
        </Card>
        <Card title="Permisos">
          <p>
            <b>Super Admin</b> · usuarios, configuración, periodos, reapertura y auditoría.
          </p>
          <p>
            <b>Admin</b> · operación, validación, excepciones y layouts.
          </p>
          <p>
            <b>Usuario</b> · carga, consulta y entrega de solicitudes.
          </p>
        </Card>
      </div>
    </section>
  );
}

function UserRow({ user, editable, disabled, onRole, onRemove }: { user: AppUser; editable: boolean; disabled: boolean; onRole: (role: Role) => void; onRemove: () => void }) {
  return (
    <div className="user-row">
      <div className="avatar">{initials(user.displayName)}</div>
      <span>
        <b>{user.displayName}</b>
        <small>{user.role}</small>
      </span>
      {editable && (
        <>
          <label className="inline-role">
            <Pencil size={13} />
            <select value={user.role} disabled={disabled} onChange={(e) => onRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button className="mini danger-icon" title="Retirar acceso" disabled={disabled} onClick={onRemove}>
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}
