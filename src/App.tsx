"use client";
import "../app/refresh.css";
import "./styles/states.css";
import type { ReactNode } from "react";
import { ApiProvider } from "./api/provider";
import { SessionProvider } from "./session/SessionProvider";
import { WorkspaceProvider, useWorkspace } from "./state/WorkspaceProvider";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { LoadingState } from "./components/shared/AsyncState";
import type { View } from "./domain/types";
import { InicioView } from "./modules/inicio/InicioView";
import { BandejaView } from "./modules/bandeja/BandejaView";
import { ValidacionView } from "./modules/validacion/ValidacionView";
import { MatrizView } from "./modules/matriz/MatrizView";
import { HistoricoView } from "./modules/historico/HistoricoView";
import { ConciliacionView } from "./modules/conciliacion/ConciliacionView";
import { LayoutHumanView } from "./modules/layout-human/LayoutHumanView";
import { AdminView } from "./modules/admin/AdminView";

const VIEWS: Record<View, () => ReactNode> = {
  inicio: () => <InicioView />,
  bandeja: () => <BandejaView />,
  validacion: () => <ValidacionView />,
  matriz: () => <MatrizView />,
  historico: () => <HistoricoView />,
  conciliacion: () => <ConciliacionView />,
  layout: () => <LayoutHumanView />,
  admin: () => <AdminView />,
};

export default function App() {
  return (
    <ApiProvider
      fallback={
        <div className="state-page">
          <LoadingState label="Iniciando…" />
        </div>
      }
    >
      <SessionProvider>
        <WorkspaceProvider>
          <Shell />
        </WorkspaceProvider>
      </SessionProvider>
    </ApiProvider>
  );
}

function Shell() {
  const { view, notice } = useWorkspace();
  return (
    <main className="shell">
      <Sidebar />
      <section className="workspace">
        <Topbar />
        {notice && (
          <div className={"notice" + (notice.tone === "error" ? " notice-error" : "")} role={notice.tone === "error" ? "alert" : "status"}>
            {notice.text}
          </div>
        )}
        {VIEWS[view]()}
      </section>
    </main>
  );
}
