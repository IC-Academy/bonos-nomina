"use client";
import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { useApi } from "../../api/provider";
import { useMutation } from "../../hooks/useMutation";
import { useResource } from "../../hooks/useResource";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { BonusTable, Head, downloadBlob } from "../../components/shared/ui";

export function HistoricoView() {
  const api = useApi();
  const { openMovement, notify, notifyError, revision } = useWorkspace();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  const results = useResource(() => api.history.search({ query: debounced || undefined }), `history:${debounced}:${revision}`);
  const exporter = useMutation((q: string) => api.history.export({ query: q || undefined }));

  return (
    <section className="screen">
      <Head title="Histórico de Bonos" text="Consulta por empleado, periodo, cliente, instalación, bono y monto." />
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empleado o concepto" />
        </div>
        <button
          disabled={exporter.pending}
          onClick={async () => {
            const r = await exporter.run(debounced);
            if (!r.ok) return notifyError(r.error);
            downloadBlob(r.data, "historico_bonos.csv");
            notify("Histórico exportado.");
          }}
        >
          <Download /> {exporter.pending ? "Exportando…" : "Exportar Excel"}
        </button>
      </div>
      <AsyncView resource={results} label="Buscando…">
        {(data) =>
          data.length ? (
            <BonusTable data={data} open={(m) => openMovement(m.id)} />
          ) : (
            <div className="empty-filter">
              <Search />
              <b>Sin resultados</b>
              <span>Prueba con otro empleado, bono o cliente.</span>
            </div>
          )
        }
      </AsyncView>
    </section>
  );
}
