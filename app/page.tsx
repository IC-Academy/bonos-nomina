"use client";

import {
  AlertCircle,
  Archive,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Files,
  Filter,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  UserRoundCog,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Role = "ABM" | "Miriam" | "Frances" | "Administrador";
type View = "inicio" | "periodos" | "detalle" | "validacion" | "documentos" | "layout" | "catalogos";
type PeriodStatus =
  | "En preparación"
  | "Entregado a Nóminas"
  | "Procesando"
  | "En validación"
  | "Con observaciones"
  | "Corregido"
  | "Validado"
  | "Layout generado"
  | "Cargado en Human"
  | "Cerrado";
type ValidationResult = "Correcto" | "Con observaciones" | "No procesado";
type RecordStatus = "Pendiente" | "Validado" | "Observado" | "Devuelto a ABM" | "Corregido" | "Excluido";

type BonusRecord = {
  id: string;
  periodId: string;
  folio: string;
  year: number;
  month: string;
  payrollType: string;
  period: string;
  employeeNumber: string;
  name: string;
  concept: string;
  bonusType: string;
  authorizedTotal: number;
  installmentAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  plaza: string;
  client: string;
  site: string;
  requestingArea: string;
  requester: string;
  authorizer: string;
  requestDate: string;
  status: RecordStatus;
  supports: string[];
  observations: string[];
  validationResult: ValidationResult;
};

type Period = {
  id: string;
  payrollType: "Qna" | "Sem II" | "IC ADMIN" | "Reclamos";
  period: string;
  year: number;
  month: string;
  abmOwner: string;
  deliveryDate: string;
  status: PeriodStatus;
  requests: number;
  employees: number;
  history: string[];
};

type DocumentItem = {
  id: string;
  periodId: string;
  type: string;
  name: string;
  date: string;
  request: string;
  status: "Procesado" | "Pendiente" | "No procesado" | "Firmado";
};

type DemoState = {
  periods: Period[];
  records: BonusRecord[];
  documents: DocumentItem[];
};

const periodFlow: PeriodStatus[] = [
  "En preparación",
  "Entregado a Nóminas",
  "Procesando",
  "En validación",
  "Con observaciones",
  "Corregido",
  "Validado",
  "Layout generado",
  "Cargado en Human",
  "Cerrado",
];

const concepts = [
  "BON_DESEMPENO",
  "BON_RECLUTAMIENTO",
  "BON_GUARDIA_MES",
  "AYUDA_TRANSPORTE",
  "BON_FACT_CLIENTE",
  "BON_HALLAZGO",
  "BON_UNICO",
  "COMP_RESPONSABILIDADES",
];

const bonusTypes = [
  "Bono por desempeño",
  "Bono tráenos uno",
  "Reclutamiento empresarial",
  "Reclutamiento Embajada",
  "Guardia del mes",
  "Acciones destacadas",
  "Asistencia perfecta",
  "Ayuda de transporte",
  "Bono facturado al cliente",
  "Bono por hallazgo",
  "Bono único",
  "Complemento de responsabilidades",
];

const fakeNames = [
  "Sofia Ramos Ortega",
  "Carlos Nieto Villar",
  "Daniela Pineda Cruz",
  "Hector Luna Arce",
  "Valeria Soto Marin",
  "Emilio Torres Cantu",
  "Mariana Reyes Solis",
  "Andres Molina Vera",
  "Paola Ibarra Neri",
  "Raul Castillo Vega",
  "Lucia Prado Montes",
  "Omar Salas Rivas",
  "Natalia Fuentes Mora",
  "Ivan Herrera Lago",
  "Camila Robles Pardo",
  "Marco Aguilar Rios",
  "Renata Silva Leon",
  "Bruno Ortega Paz",
  "Alejandra Mesa Gil",
  "Diego Valencia Ruiz",
  "Fernanda Trejo Alba",
  "Javier Cortes Mena",
  "Monica Beltran Saenz",
  "Eduardo Navarro Lira",
  "Ana Paula Cardenas",
  "Luis Aranda Sol",
];

const basePeriods: Period[] = [
  {
    id: "p-qna-16",
    payrollType: "Qna",
    period: "16",
    year: 2026,
    month: "Agosto",
    abmOwner: "ABM Operaciones",
    deliveryDate: "2026-08-16",
    status: "Con observaciones",
    requests: 8,
    employees: 9,
    history: [
      "ABM creó carpeta Qna 16.",
      "Se detectaron RHOO-F029, PDF firmados, correos .msg y soportes.",
      "Miriam inició validación y dejó observaciones.",
    ],
  },
  {
    id: "p-sem-34",
    payrollType: "Sem II",
    period: "34",
    year: 2026,
    month: "Agosto",
    abmOwner: "ABM Operaciones",
    deliveryDate: "2026-08-24",
    status: "Entregado a Nóminas",
    requests: 7,
    employees: 8,
    history: ["ABM marcó Sem II 34 como entregado a Nóminas."],
  },
  {
    id: "p-icadmin-16",
    payrollType: "IC ADMIN",
    period: "QNA 16",
    year: 2026,
    month: "Agosto",
    abmOwner: "Share Service Center",
    deliveryDate: "2026-08-16",
    status: "Validado",
    requests: 5,
    employees: 5,
    history: ["IC ADMIN QNA 16 validado contra catálogo provisional."],
  },
  {
    id: "p-prep-17",
    payrollType: "Qna",
    period: "17",
    year: 2026,
    month: "Agosto",
    abmOwner: "ABM Operaciones",
    deliveryDate: "",
    status: "En preparación",
    requests: 2,
    employees: 2,
    history: ["Periodo en preparación con carga documental incompleta."],
  },
  {
    id: "p-reclamos-67",
    payrollType: "Reclamos",
    period: "SEM II 067",
    year: 2026,
    month: "Agosto",
    abmOwner: "ABM Reclamos",
    deliveryDate: "2026-08-25",
    status: "Layout generado",
    requests: 3,
    employees: 3,
    history: ["Reclamos con layout TXT simulado generado."],
  },
];

const makeRecord = (
  index: number,
  periodId: string,
  payrollType: string,
  period: string,
  overrides: Partial<BonusRecord> = {},
): BonusRecord => {
  const bonusType = bonusTypes[index % bonusTypes.length];
  const concept = concepts[index % concepts.length];
  const validationResult = overrides.validationResult ?? "Correcto";
  const status =
    overrides.status ??
    (validationResult === "Correcto"
      ? "Pendiente"
      : validationResult === "No procesado"
        ? "Excluido"
        : "Observado");
  return {
    id: `r-${periodId}-${index}`,
    periodId,
    folio: `BON-${payrollType.replace(" ", "").toUpperCase()}-2026-${String(period).replace(/\D/g, "").padStart(3, "0")}-${String(index + 31).padStart(5, "0")}`,
    year: 2026,
    month: "Agosto",
    payrollType,
    period,
    employeeNumber: `${240000 + index * 137}`,
    name: fakeNames[index % fakeNames.length],
    concept,
    bonusType,
    authorizedTotal: 900 + (index % 7) * 420,
    installmentAmount: 900 + (index % 7) * 420,
    installmentNumber: 1,
    totalInstallments: 1,
    plaza: ["CDMX", "Monterrey", "Guadalajara", "Querétaro"][index % 4],
    client: ["Embajada USE", "Desarrollo Logístico", "Qualitas", "Inter-Con Corporativo"][index % 4],
    site: ["Corporativo", "CEDIS Norte", "Torre Reforma", "Campus Sur"][index % 4],
    requestingArea: ["Operaciones", "Atracción de Talento", "Finanzas", "ABM"][index % 4],
    requester: ["Laura Medina", "Pablo Quiroz", "Nora Estrada", "Alma Correa"][index % 4],
    authorizer: ["Dirección Operativa", "Gerencia RH", "Finanzas MX", "Cliente autorizado"][index % 4],
    requestDate: `2026-08-${String(5 + (index % 20)).padStart(2, "0")}`,
    status,
    supports: ["RHOO-F029", "PDF firmado", "Correo .msg"],
    observations:
      validationResult === "Correcto"
        ? []
        : ["Validación simulada pendiente de aclarar antes del layout."],
    validationResult,
    ...overrides,
  };
};

const baseRecords: BonusRecord[] = [
  ...Array.from({ length: 8 }, (_, i) => makeRecord(i, "p-qna-16", "Qna", "16")),
  makeRecord(8, "p-qna-16", "Qna", "16", {
    employeeNumber: "",
    validationResult: "Con observaciones",
    observations: ["Número de empleado faltante."],
  }),
  makeRecord(9, "p-qna-16", "Qna", "16", {
    installmentAmount: 500,
    totalInstallments: 2,
    authorizedTotal: 1000,
    observations: ["Parcialidad 1 de 2; segunda parcialidad programada para QNA 17."],
  }),
  makeRecord(10, "p-sem-34", "Sem II", "34", {
    bonusType: "Ayuda de transporte",
    concept: "AYUDA_TRANSPORTE",
  }),
  makeRecord(11, "p-sem-34", "Sem II", "34", {
    installmentAmount: 0,
    validationResult: "Con observaciones",
    observations: ["Importe vacío en RHOO-F029."],
  }),
  makeRecord(12, "p-sem-34", "Sem II", "34", {
    validationResult: "Con observaciones",
    observations: ["Solicitud sin soporte adjunto."],
    supports: ["RHOO-F029"],
  }),
  makeRecord(13, "p-sem-34", "Sem II", "34", {
    validationResult: "Con observaciones",
    observations: ["Concepto de nómina no homologado."],
    concept: "BONO_ESPECIAL_CLIENTE",
  }),
  makeRecord(14, "p-sem-34", "Sem II", "34", {
    validationResult: "No procesado",
    observations: ["Archivo no procesado por formato ilegible."],
    supports: ["Fotografía"],
  }),
  makeRecord(15, "p-icadmin-16", "IC ADMIN", "QNA 16", {
    validationResult: "Con observaciones",
    observations: ["Empleado IC ADMIN pendiente de validar en catálogo."],
  }),
  makeRecord(16, "p-icadmin-16", "IC ADMIN", "QNA 16", { status: "Validado" }),
  makeRecord(17, "p-icadmin-16", "IC ADMIN", "QNA 16", { status: "Validado" }),
  makeRecord(18, "p-prep-17", "Qna", "17", {
    installmentAmount: 500,
    totalInstallments: 2,
    installmentNumber: 2,
    authorizedTotal: 1000,
  }),
  makeRecord(19, "p-prep-17", "Qna", "17", {
    validationResult: "Con observaciones",
    observations: ["Bono sin autorización."],
  }),
  makeRecord(20, "p-reclamos-67", "Reclamos", "SEM II 067", {
    bonusType: "Bono por hallazgo",
    concept: "BON_HALLAZGO",
    status: "Validado",
  }),
  makeRecord(21, "p-reclamos-67", "Reclamos", "SEM II 067", {
    status: "Validado",
    observations: ["Reclamo autorizado no pagado en el periodo original."],
  }),
  makeRecord(22, "p-reclamos-67", "Reclamos", "SEM II 067", {
    validationResult: "Con observaciones",
    observations: ["Registro duplicado detectado contra layout previo."],
  }),
  makeRecord(23, "p-qna-16", "Qna", "16", {
    validationResult: "Con observaciones",
    observations: ["Empleado que no corresponde al tipo de nómina."],
  }),
  makeRecord(24, "p-qna-16", "Qna", "16", {
    authorizedTotal: 1000,
    installmentAmount: 1200,
    totalInstallments: 2,
    validationResult: "Con observaciones",
    observations: ["Parcialidades superiores al total autorizado."],
  }),
];

const baseDocuments: DocumentItem[] = [
  "RHOO-F029 SOLICITUD PARA PAGO DE BONO POR DESEMPEÑO QNA 16.xlsx",
  "RHOO-F029 BONO POR RECLUTAMIENTO EMBAJADA AMERICANA QNA 16.xlsx",
  "RHOO-F029 SOLICITUD PARA PAGO BONO TRAENOS UNO QNA 16.xlsx",
  "RHOO-F029 SOLICITUD PARA PAGO AYUDAS DE TRANSPORTE SEM 34.xlsx",
  "PDF firmado bonos empresariales QNA 16.pdf",
  "Correo autorización bono facturado.msg",
  "Captura evidencia servicio.png",
  "Fotografía soporte acciones destacadas.jpg",
  "Modelo de Revisión Nom Quincena 16.xlsx",
  "Layout reclamos SEM II 067.txt",
].map((name, i) => ({
  id: `d-${i}`,
  periodId: i < 3 || i === 4 || i === 8 ? "p-qna-16" : i === 9 ? "p-reclamos-67" : "p-sem-34",
  type: name.includes(".msg")
    ? "Correo .msg"
    : name.includes(".pdf")
      ? "PDF"
      : name.includes(".txt")
        ? "TXT"
        : name.includes(".jpg") || name.includes(".png")
          ? "Imagen"
          : "Excel",
  name,
  date: `2026-08-${String(10 + i).padStart(2, "0")}`,
  request: ["Desempeño", "Reclutamiento", "Tráenos uno", "Transporte", "Autorización"][i % 5],
  status: i === 7 ? "No procesado" : i === 5 ? "Pendiente" : i === 4 ? "Firmado" : "Procesado",
}));

const seed: DemoState = { periods: basePeriods, records: baseRecords, documents: baseDocuments };
const storageKey = "intercon-bonos-demo-v1";

const repository = {
  load(): DemoState {
    if (typeof window === "undefined") return seed;
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : seed;
  },
  save(state: DemoState) {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  },
  reset() {
    window.localStorage.removeItem(storageKey);
  },
};

const ms365Adapters = {
  signInWithEntraId: "Reemplazar selector de perfil por Microsoft Entra ID.",
  readSharePointFolders: "Conectar lectura de carpetas ABM vía Microsoft Graph.",
  writeMicrosoftLists: "Persistir periodos, registros e historial en Microsoft Lists.",
  uploadSharePointDocuments: "Enviar soportes corregidos a SharePoint.",
  runPowerAutomate: "Disparar flujos de aprobación y cierre.",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);

const statusClass: Record<string, string> = {
  Correcto: "ok",
  Validado: "ok",
  Corregido: "ok",
  "Layout generado": "ok",
  Cerrado: "ok",
  "Cargado en Human": "ok",
  "Con observaciones": "warn",
  Observado: "warn",
  "Devuelto a ABM": "warn",
  "No procesado": "bad",
  Excluido: "bad",
  Procesando: "info",
  "En validación": "info",
  "Entregado a Nóminas": "info",
  "En preparación": "neutral",
  Pendiente: "neutral",
};

export default function Home() {
  const [state, setState] = useState<DemoState>(() => repository.load());
  const [role, setRole] = useState<Role>("ABM");
  const [view, setView] = useState<View>("inicio");
  const [selectedPeriodId, setSelectedPeriodId] = useState("p-qna-16");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [editing, setEditing] = useState<BonusRecord | null>(null);
  const [notice, setNotice] = useState("Datos demo cargados. Puedes restablecerlos cuando quieras.");

  useEffect(() => repository.save(state), [state]);

  const selectedPeriod = state.periods.find((period) => period.id === selectedPeriodId) ?? state.periods[0];
  const selectedRecords = state.records.filter((record) => record.periodId === selectedPeriod.id);
  const selectedDocuments = state.documents.filter((document) => document.periodId === selectedPeriod.id);
  const allIncluded = state.records.filter((record) => record.status === "Validado" && record.validationResult === "Correcto");

  const kpis = useMemo(() => {
    const amount = state.records.reduce((sum, record) => sum + record.installmentAmount, 0);
    const correct = state.records.filter((record) => record.validationResult === "Correcto").length;
    const observed = state.records.filter((record) => record.validationResult === "Con observaciones").length;
    const valid = state.records.filter((record) => record.status === "Validado").length;
    return {
      periods: state.periods.filter((period) => period.status !== "Cerrado").length,
      records: state.records.length,
      amount,
      correct,
      observed,
      percent: Math.round((valid / Math.max(state.records.length, 1)) * 100),
      hours: Math.round(state.periods.length * 7.2),
    };
  }, [state]);

  const mutate = (updater: (draft: DemoState) => DemoState, message: string) => {
    setState((current) => updater(structuredClone(current)));
    setNotice(message);
  };

  const updatePeriodStatus = (periodId: string, status: PeriodStatus, message: string) => {
    mutate((draft) => {
      const period = draft.periods.find((item) => item.id === periodId);
      if (period) {
        period.status = status;
        if (!period.deliveryDate && status !== "En preparación") period.deliveryDate = "2026-09-01";
        period.history.unshift(`${new Date().toLocaleString("es-MX")}: ${message}`);
      }
      return draft;
    }, message);
  };

  const updateRecord = (record: BonusRecord, message: string) => {
    mutate((draft) => {
      draft.records = draft.records.map((item) => (item.id === record.id ? record : item));
      const period = draft.periods.find((item) => item.id === record.periodId);
      period?.history.unshift(`${new Date().toLocaleString("es-MX")}: ${message} (${record.folio}).`);
      return draft;
    }, message);
    setEditing(null);
  };

  const createPeriod = () => {
    const id = `p-new-${Date.now()}`;
    mutate((draft) => {
      draft.periods.unshift({
        id,
        payrollType: "Qna",
        period: "18",
        year: 2026,
        month: "Septiembre",
        abmOwner: "ABM Operaciones",
        deliveryDate: "",
        status: "En preparación",
        requests: 0,
        employees: 0,
        history: ["Periodo simulado creado por ABM."],
      });
      return draft;
    }, "Periodo QNA 18 creado en preparación.");
    setSelectedPeriodId(id);
    setView("detalle");
  };

  const simulateUpload = () => {
    mutate((draft) => {
      draft.documents.unshift({
        id: `d-${Date.now()}`,
        periodId: selectedPeriod.id,
        type: "Excel",
        name: `RHOO-F029 carga simulada ${selectedPeriod.payrollType} ${selectedPeriod.period}.xlsx`,
        date: "2026-09-01",
        request: "Carga ABM",
        status: "Pendiente",
      });
      const period = draft.periods.find((item) => item.id === selectedPeriod.id);
      if (period) period.requests += 1;
      return draft;
    }, "Archivo simulado agregado al periodo.");
  };

  const processPeriod = () => {
    updatePeriodStatus(selectedPeriod.id, "En validación", "Procesamiento simulado terminado; registros estandarizados listos.");
  };

  const generateLayout = () => {
    updatePeriodStatus(selectedPeriod.id, "Layout generado", "Layout TXT generado desde registros validados.");
  };

  const registerHuman = () => {
    updatePeriodStatus(selectedPeriod.id, "Cargado en Human", "Carga a Human registrada.");
  };

  const closePeriod = () => {
    updatePeriodStatus(selectedPeriod.id, "Cerrado", "Periodo cerrado con trazabilidad completa.");
  };

  const download = (filename: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${filename} descargado.`);
  };

  const layoutTxt = selectedRecords
    .filter((record) => record.status === "Validado" && record.validationResult === "Correcto")
    .map((record) =>
      [
        record.employeeNumber,
        record.concept,
        record.installmentAmount.toFixed(2),
        record.period,
        record.folio,
        record.bonusType,
      ].join("|"),
    )
    .join("\n");

  const csv = [
    "folio,empleado,nombre,tipo_nomina,periodo,concepto,bono,importe,estado,validacion",
    ...selectedRecords.map((record) =>
      [
        record.folio,
        record.employeeNumber,
        record.name,
        record.payrollType,
        record.period,
        record.concept,
        record.bonusType,
        record.installmentAmount,
        record.status,
        record.validationResult,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const filteredRecords = state.records.filter((record) => {
    const text = `${record.folio} ${record.name} ${record.bonusType} ${record.concept}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFilter = filter === "Todos" || record.validationResult === filter || record.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>IC</span>
          <div>
            <strong>Bonos MX</strong>
            <small>Automatización ABM/Nóminas</small>
          </div>
        </div>
        <nav>
          {[
            ["inicio", "Inicio", LayoutDashboard],
            ["periodos", "Periodos", Archive],
            ["detalle", "Detalle", ClipboardCheck],
            ["validacion", "Validación", ListChecks],
            ["documentos", "Documentos", Files],
            ["layout", "Layout Human", FileSpreadsheet],
            ["catalogos", "Catálogos", Settings],
          ].map(([key, label, Icon]) => (
            <button key={key as string} className={view === key ? "active" : ""} onClick={() => setView(key as View)}>
              <Icon size={18} />
              <span>{label as string}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <small>Demo funcional con datos simulados</small>
            <h1>Automatización de bonos de nómina</h1>
          </div>
          <div className="profile-switcher">
            {(["ABM", "Miriam", "Frances", "Administrador"] as Role[]).map((item) => (
              <button key={item} className={role === item ? "selected" : ""} onClick={() => setRole(item)}>
                {item}
              </button>
            ))}
          </div>
        </header>

        <div className="notice">
          <ShieldCheck size={18} />
          <span>{notice}</span>
          <button
            onClick={() => {
              repository.reset();
              setState(seed);
              setNotice("Datos de demostración restablecidos.");
            }}
          >
            <RefreshCw size={16} />
            Restablecer demo
          </button>
        </div>

        {view === "inicio" && (
          <section className="screen">
            <div className="kpi-grid">
              <Kpi icon={Archive} label="Periodos activos" value={kpis.periods} />
              <Kpi icon={Files} label="Registros recibidos" value={kpis.records} />
              <Kpi icon={BriefcaseBusiness} label="Importe total" value={money(kpis.amount)} />
              <Kpi icon={CheckCircle2} label="Registros correctos" value={kpis.correct} />
              <Kpi icon={AlertCircle} label="Observaciones" value={kpis.observed} />
              <Kpi icon={BarChart3} label="Porcentaje validado" value={`${kpis.percent}%`} />
              <Kpi icon={BadgeCheck} label="Horas estimadas ahorradas" value={`${kpis.hours} h`} />
            </div>
            <div className="two-columns">
              <Panel title="Periodos prioritarios">
                {state.periods.slice(0, 4).map((period) => (
                  <button
                    className="period-row"
                    key={period.id}
                    onClick={() => {
                      setSelectedPeriodId(period.id);
                      setView("detalle");
                    }}
                  >
                    <span>
                      <strong>{period.payrollType} {period.period}</strong>
                      <small>{period.abmOwner} · {period.requests} solicitudes · {period.employees} empleados</small>
                    </span>
                    <StatusChip value={period.status} />
                    <ChevronRight size={16} />
                  </button>
                ))}
              </Panel>
              <Panel title="Actividad reciente">
                <Timeline compact items={state.periods.flatMap((period) => period.history.slice(0, 2)).slice(0, 7)} />
              </Panel>
            </div>
          </section>
        )}

        {view === "periodos" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>Periodos</h2>
                <p>Carpetas ABM convertidas en periodos controlados para validación de Nóminas.</p>
              </div>
              {role === "ABM" && <Action onClick={createPeriod} icon={CalendarPlus} label="Crear periodo" />}
            </div>
            <div className="period-grid">
              {state.periods.map((period) => {
                const records = state.records.filter((record) => record.periodId === period.id);
                const amount = records.reduce((sum, record) => sum + record.installmentAmount, 0);
                return (
                  <article className="period-card" key={period.id}>
                    <div>
                      <StatusChip value={period.status} />
                      <h3>{period.payrollType} {period.period}</h3>
                      <p>{period.month} {period.year} · {period.abmOwner}</p>
                    </div>
                    <div className="period-metrics">
                      <span>{period.requests}<small>solicitudes</small></span>
                      <span>{period.employees}<small>empleados</small></span>
                      <span>{money(amount)}<small>importe</small></span>
                    </div>
                    <Progress value={flowPercent(period.status)} />
                    <button onClick={() => { setSelectedPeriodId(period.id); setView("detalle"); }}>Abrir detalle</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {view === "detalle" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>{selectedPeriod.payrollType} {selectedPeriod.period}</h2>
                <p>{selectedPeriod.month} {selectedPeriod.year} · Responsable: {selectedPeriod.abmOwner}</p>
              </div>
              <div className="actions">
                {role === "ABM" && <Action onClick={simulateUpload} icon={Upload} label="Cargar archivo" secondary />}
                {role === "ABM" && selectedPeriod.status === "En preparación" && (
                  <Action onClick={() => updatePeriodStatus(selectedPeriod.id, "Entregado a Nóminas", "Periodo entregado a Nóminas.")} icon={Send} label="Entregar a Nóminas" />
                )}
                {role === "Miriam" && selectedPeriod.status === "Entregado a Nóminas" && <Action onClick={processPeriod} icon={RefreshCw} label="Procesar documentos" />}
                {role === "Miriam" && <Action onClick={() => updatePeriodStatus(selectedPeriod.id, "Validado", "Periodo validado por Nóminas.")} icon={BadgeCheck} label="Validar periodo" />}
              </div>
            </div>
            <Timeline items={periodFlow.map((step) => `${step}${periodFlow.indexOf(step) <= periodFlow.indexOf(selectedPeriod.status) ? " completado" : ""}`)} status={selectedPeriod.status} />
            <div className="kpi-grid compact">
              <Kpi icon={Files} label="Solicitudes" value={selectedPeriod.requests} />
              <Kpi icon={UserRoundCog} label="Empleados" value={selectedRecords.length} />
              <Kpi icon={BriefcaseBusiness} label="Importe" value={money(selectedRecords.reduce((sum, record) => sum + record.installmentAmount, 0))} />
              <Kpi icon={AlertCircle} label="Excepciones" value={selectedRecords.filter((record) => record.validationResult !== "Correcto").length} />
            </div>
            <div className="two-columns wide-left">
              <Panel title="Detalle por empleado">
                <RecordsTable records={selectedRecords.slice(0, 8)} onOpen={setEditing} />
              </Panel>
              <Panel title="Documentos e historial">
                <div className="doc-list">
                  {selectedDocuments.slice(0, 5).map((document) => (
                    <div key={document.id}>
                      <Files size={16} />
                      <span>{document.name}<small>{document.type} · {document.status}</small></span>
                    </div>
                  ))}
                </div>
                <Timeline compact items={selectedPeriod.history} />
              </Panel>
            </div>
          </section>
        )}

        {view === "validacion" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>Bandeja de validación</h2>
                <p>Miriam revisa excepciones, corrige datos, valida o devuelve registros a ABM.</p>
              </div>
            </div>
            <div className="toolbar">
              <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar folio, empleado o concepto" /></label>
              <label><Filter size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)}>
                {["Todos", "Correcto", "Con observaciones", "No procesado", "Validado", "Devuelto a ABM"].map((option) => <option key={option}>{option}</option>)}
              </select></label>
            </div>
            <RecordsTable records={filteredRecords} onOpen={setEditing} full />
          </section>
        )}

        {view === "documentos" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>Documentos</h2>
                <p>Inventario simulado de RHOO-F029, correos, capturas, fotografías, PDF y layouts.</p>
              </div>
              {role === "ABM" && <Action onClick={simulateUpload} icon={Upload} label="Simular carga" />}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Tipo</th><th>Nombre</th><th>Fecha</th><th>Solicitud</th><th>Estado</th></tr></thead>
                <tbody>{state.documents.map((document) => (
                  <tr key={document.id}><td>{document.type}</td><td>{document.name}</td><td>{document.date}</td><td>{document.request}</td><td><StatusChip value={document.status} /></td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        )}

        {view === "layout" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>Generación de layout Human</h2>
                <p>Incluye únicamente registros correctos y validados; excluye observados y no procesados.</p>
              </div>
              <div className="actions">
                {role === "Miriam" && <Action onClick={generateLayout} icon={FileSpreadsheet} label="Generar layout" />}
                <Action onClick={() => download(`LAYOUT_${selectedPeriod.payrollType}_${selectedPeriod.period}.txt`, layoutTxt || "SIN_REGISTROS_VALIDOS")} icon={Download} label="Descargar TXT" secondary />
                <Action onClick={() => download(`CONCENTRADO_${selectedPeriod.payrollType}_${selectedPeriod.period}.csv`, csv, "text/csv")} icon={Download} label="Descargar CSV" secondary />
              </div>
            </div>
            <div className="kpi-grid compact">
              <Kpi icon={CheckCircle2} label="Registros incluidos" value={selectedRecords.filter((r) => r.status === "Validado" && r.validationResult === "Correcto").length} />
              <Kpi icon={AlertCircle} label="Registros excluidos" value={selectedRecords.filter((r) => r.status !== "Validado" || r.validationResult !== "Correcto").length} />
              <Kpi icon={BriefcaseBusiness} label="Importe layout" value={money(allIncluded.reduce((sum, record) => sum + record.installmentAmount, 0))} />
              <Kpi icon={ShieldCheck} label="Validaciones previas" value="10 reglas" />
            </div>
            <pre className="txt-preview">{layoutTxt || "No hay registros validados para este periodo. Valida al menos un registro correcto."}</pre>
            <div className="actions">
              {role === "Miriam" && selectedPeriod.status === "Layout generado" && <Action onClick={registerHuman} icon={Upload} label="Registrar carga a Human" />}
              {role === "Miriam" && selectedPeriod.status === "Cargado en Human" && <Action onClick={closePeriod} icon={BadgeCheck} label="Cerrar periodo" />}
            </div>
          </section>
        )}

        {view === "catalogos" && (
          <section className="screen">
            <div className="section-head">
              <div>
                <h2>Catálogos y reglas</h2>
                <p>Administración simulada lista para reemplazarse por Microsoft Lists y Graph.</p>
              </div>
            </div>
            <div className="catalog-grid">
              <Catalog title="Conceptos de Human" items={concepts} />
              <Catalog title="Tipos de bono" items={bonusTypes} />
              <Catalog title="Empleados IC ADMIN" items={["ICM-90021 · Analista SSC", "ICM-90044 · Coordinador RH", "ICM-90102 · Finanzas", "Pendiente de validar · 3"]} />
              <Catalog title="Reglas de validación" items={["Empleado obligatorio", "Importe requerido", "Duplicados por folio", "Soporte obligatorio", "Autorización firmada", "Concepto homologado", "Tipo de nómina correcto", "Parcialidades <= autorizado"]} />
              <Catalog title="Adaptadores Microsoft 365" items={Object.values(ms365Adapters)} />
            </div>
          </section>
        )}
      </section>

      {editing && (
        <div className="modal-backdrop">
          <button className="backdrop-close" aria-label="Cerrar panel de revisión" onClick={() => setEditing(null)} />
          <form className="drawer" onSubmit={(event) => event.preventDefault()}>
            <header>
              <span><strong>{editing.folio}</strong><small>{editing.name}</small></span>
              <StatusChip value={editing.validationResult} />
            </header>
            <label>Empleado<input value={editing.employeeNumber} onChange={(event) => setEditing({ ...editing, employeeNumber: event.target.value })} /></label>
            <label>Concepto<input value={editing.concept} onChange={(event) => setEditing({ ...editing, concept: event.target.value })} /></label>
            <label>Importe parcialidad<input type="number" value={editing.installmentAmount} onChange={(event) => setEditing({ ...editing, installmentAmount: Number(event.target.value) })} /></label>
            <label>Observaciones<textarea value={editing.observations.join("\n")} onChange={(event) => setEditing({ ...editing, observations: event.target.value.split("\n").filter(Boolean) })} /></label>
            <div className="drawer-actions">
              <button onClick={() => updateRecord({ ...editing, status: "Validado", validationResult: "Correcto", observations: [] }, "Registro validado")}>Validar</button>
              <button onClick={() => updateRecord({ ...editing, status: "Devuelto a ABM", validationResult: "Con observaciones" }, "Registro devuelto a ABM")}>Devolver a ABM</button>
              <button onClick={() => updateRecord({ ...editing, status: "Corregido", validationResult: "Correcto" }, "Registro corregido")}>Guardar corrección</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: string | number }) {
  return <article className="kpi"><Icon size={20} /><span>{label}</span><strong>{value}</strong></article>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h3>{title}</h3>{children}</section>;
}

function Action({ icon: Icon, label, onClick, secondary = false }: { icon: typeof Archive; label: string; onClick: () => void; secondary?: boolean }) {
  return <button className={secondary ? "action secondary" : "action"} onClick={onClick}><Icon size={17} />{label}</button>;
}

function StatusChip({ value }: { value: string }) {
  return <span className={`chip ${statusClass[value] ?? "neutral"}`}>{value}</span>;
}

function Progress({ value }: { value: number }) {
  return <div className="progress"><span style={{ width: `${value}%` }} /></div>;
}

function flowPercent(status: PeriodStatus) {
  return Math.round(((periodFlow.indexOf(status) + 1) / periodFlow.length) * 100);
}

function Timeline({ items, compact = false, status }: { items: string[]; compact?: boolean; status?: PeriodStatus }) {
  return <ol className={compact ? "timeline compact" : "timeline"}>{items.map((item, index) => (
    <li key={`${item}-${index}`} className={status && periodFlow[index] === status ? "current" : ""}>{item}</li>
  ))}</ol>;
}

function RecordsTable({ records, onOpen, full = false }: { records: BonusRecord[]; onOpen: (record: BonusRecord) => void; full?: boolean }) {
  return <div className="table-wrap"><table>
    <thead><tr><th>Folio</th><th>Empleado</th><th>Concepto</th><th>Bono</th><th>Importe</th><th>Validación</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>{records.map((record) => (
      <tr key={record.id}>
        <td>{record.folio}</td>
        <td><strong>{record.name}</strong><small>{record.employeeNumber || "Sin número"}</small></td>
        <td>{record.concept}</td>
        <td>{record.bonusType}</td>
        <td>{money(record.installmentAmount)}</td>
        <td><StatusChip value={record.validationResult} /></td>
        <td><StatusChip value={record.status} /></td>
        <td><button className="mini" onClick={() => onOpen(record)}>{full ? "Revisar" : "Abrir"}</button></td>
      </tr>
    ))}</tbody>
  </table></div>;
}

function Catalog({ title, items }: { title: string; items: string[] }) {
  return <section className="panel catalog"><h3>{title}</h3>{items.map((item) => <div key={item}><Building2 size={15} /><span>{item}</span></div>)}</section>;
}
