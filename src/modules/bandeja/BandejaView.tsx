"use client";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GitBranch, LockKeyhole, Search } from "lucide-react";
import { useApi } from "../../api/provider";
import { money } from "../../domain/format";
import { filterMovements, groupByBonus, isOk } from "../../domain/movements";
import { BONUS_STATUSES, type BonusStatus } from "../../domain/types";
import { useMutation } from "../../hooks/useMutation";
import { useSession } from "../../session/SessionProvider";
import { useWorkspace } from "../../state/WorkspaceProvider";
import { AsyncView } from "../../components/shared/AsyncState";
import { BonusTable, Head, Status } from "../../components/shared/ui";

export function BandejaView() {
  const api = useApi();
  const { can } = useSession();
  const { period, movements, openMovement, notify, notifyError } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BonusStatus | "Todos">("Todos");
  const [expanded, setExpanded] = useState<string[]>(["Ayuda de transporte", "Asistencia", "Acciones destacadas"]);
  const extend = useMutation((id: string) => api.periods.createExtension(id));
  const deliver = useMutation((id: string) => api.periods.deliverToPayroll(id));

  const groups = useMemo(() => groupByBonus(filterMovements(movements.data ?? [], query, status)), [movements.data, query, status]);
  const p = period.data;
  const toggle = (name: string) => setExpanded((c) => (c.includes(name) ? c.filter((i) => i !== name) : [...c, name]));

  return (
    <section className="screen">
      <Head title={`Bandeja ${p?.title ?? ""}`.trim()} text="Lo entregado a Nóminas queda congelado para revisión; los ajustes posteriores requieren extensión." />
      <div className="frozen-banner">
        <LockKeyhole size={18} />
        <span>
          <b>Versión original protegida</b>
          <small>Los rechazos generan una extensión para ABM sin modificar la entrega original.</small>
        </span>
        <em>Ronda {p?.version ?? "–"}</em>
      </div>
      <div className="toolbar inbox-toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Empleado, bono, cliente o instalación" />
        </div>
        <label className="result-filter">
          Resultado
          <select value={status} onChange={(e) => setStatus(e.target.value as BonusStatus | "Todos")}>
            <option>Todos</option>
            {BONUS_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {can("periodo.extender") && (
          <button
            className="secondary"
            disabled={!p || extend.pending}
            onClick={async () => {
              if (!p) return;
              const r = await extend.run(p.id);
              if (!r.ok) return notifyError(r.error);
              period.setData(() => r.data);
              notify("Extensión creada con trazabilidad de cambios.");
            }}
          >
            <GitBranch /> {extend.pending ? "Creando…" : "Crear extensión"}
          </button>
        )}
        {can("periodo.entregar") && (
          <button
            disabled={!p || deliver.pending}
            onClick={async () => {
              if (!p) return;
              const r = await deliver.run(p.id);
              if (!r.ok) return notifyError(r.error);
              period.setData(() => r.data);
              notify("Periodo entregado a Nóminas; la versión quedó congelada.");
            }}
          >
            {deliver.pending ? "Entregando…" : "Entregar a Nóminas"}
          </button>
        )}
      </div>
      <AsyncView resource={movements} label="Cargando movimientos…">
        {() => (
          <div className="inbox-groups">
            {Object.entries(groups).map(([name, items]) => {
              const pending = items.filter((i) => !isOk(i.status)).length;
              return (
                <section className="inbox-group" key={name}>
                  <button className="inbox-group-head" onClick={() => toggle(name)}>
                    <span>
                      <b>{name}</b>
                      <small>
                        {items.length} movimientos · {pending} por revisar · {money(items.reduce((sum, i) => sum + i.requested, 0))}
                      </small>
                    </span>
                    <span className="group-status">
                      <Status s={pending ? "Revisión" : "Cumple"} />
                      {expanded.includes(name) ? <ChevronUp /> : <ChevronDown />}
                    </span>
                  </button>
                  {expanded.includes(name) && <BonusTable data={items} open={(m) => openMovement(m.id)} />}
                </section>
              );
            })}
            {!Object.keys(groups).length && (
              <div className="empty-filter">
                <Search />
                <b>Sin resultados</b>
                <span>Prueba cambiando el texto o el filtro de resultado.</span>
              </div>
            )}
          </div>
        )}
      </AsyncView>
    </section>
  );
}
