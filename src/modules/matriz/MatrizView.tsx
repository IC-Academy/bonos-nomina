"use client";
import { useRef } from "react";
import { Upload } from "lucide-react";
import { useApi } from "../../api/provider";
import { useMutation } from "../../hooks/useMutation";
import { useResource } from "../../hooks/useResource";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { Head, Status } from "../../components/shared/ui";

export function MatrizView() {
  const api = useApi();
  const { can } = useSession();
  const { notify, notifyError } = useWorkspace();
  const rules = useResource(() => api.matrix.listRules(), "matrix-rules");
  const importer = useMutation((file: File) => api.matrix.importMatrix(file));
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <section className="screen">
      <Head title="Matriz de Bonos" text="Catálogo maestro versionado. En producción se cargará la matriz autorizada y sus reglas." />
      {can("matriz.administrar") && (
        <div className="toolbar">
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const r = await importer.run(file);
              if (!r.ok) return r.error.kind === "not_configured" ? notify(r.error.message) : notifyError(r.error);
              notify(`Matriz actualizada a la versión ${r.data.version}.`);
              rules.reload();
            }}
          />
          <button disabled={importer.pending} onClick={() => fileInput.current?.click()}>
            <Upload /> {importer.pending ? "Cargando…" : "Actualizar matriz"}
          </button>
          <button className="secondary" onClick={() => notify("El alta de nuevos bonos se definirá junto con el modelo de datos de la matriz.")}>
            Nuevo bono
          </button>
        </div>
      )}
      <AsyncView resource={rules} label="Cargando matriz…">
        {(data) => (
          <table>
            <thead>
              <tr>
                <th>Bono</th>
                <th>Cliente / instalación</th>
                <th>Tipo</th>
                <th>Periodicidad</th>
                <th>Validación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>{r.bonus}</td>
                  <td>{r.scope}</td>
                  <td>{r.amountType}</td>
                  <td>{r.periodicity}</td>
                  <td>{r.validation}</td>
                  <td>
                    <Status s={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AsyncView>
    </section>
  );
}
