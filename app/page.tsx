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
import { useEffect, useMemo, useState, type ReactNode } from "react";

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
type LayoutStatus =
  | "Borrador"
  | "Pendiente de validación"
  | "Listo para generar"
  | "Layout generado"
  | "Regenerado"
  | "Cargado en Human"
  | "Cancelado";

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

type ConceptMapping = {
  id: string;
  humanCode: string;
  humanConcept: string;
  bonusTypes: string[];
  active: boolean;
  repeatBatchOnEveryLine: boolean;
};

type LayoutVersion = {
  id: string;
  periodId: string;
  version: number;
  status: LayoutStatus;
  batchId: string;
  payrollType: string;
  year: number;
  period: string;
  responsible: string;
  generatedAt: string;
  included: number;
  excluded: number;
  employees: number;
  amount: number;
  structuralValid: boolean;
  justification?: string;
  loadResult?: string;
  loadComments?: string;
};

type LayoutForm = {
  payrollType: string;
  year: number;
  period: string;
  batchId: string;
  responsible: string;
  generationDate: string;
};

type LayoutMovement = {
  record: BonusRecord;
  selected: boolean;
  humanCode: string;
  humanConcept: string;
  confirmedEmployee: string;
  blockingErrors: string[];
  warnings: string[];
  included: boolean;
  exclusionReason: string;
};

type DemoState = {
  periods: Period[];
  records: BonusRecord[];
  documents: DocumentItem[];
  conceptMappings: ConceptMapping[];
  employeeSheets: Record<string, string[]>;
  layoutVersions: LayoutVersion[];
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

const baseConceptMappings: ConceptMapping[] = [
  {
    id: "c-5380",
    humanCode: "5380",
    humanConcept: "Acciones destacadas",
    bonusTypes: ["Acciones destacadas"],
    active: true,
    repeatBatchOnEveryLine: false,
  },
  {
    id: "c-5280",
    humanCode: "5280",
    humanConcept: "Bonos generales",
    bonusTypes: [
      "Bono por desempeño",
      "Bono tráenos uno",
      "Reclutamiento empresarial",
      "Reclutamiento Embajada",
      "Guardia del mes",
      "Asistencia perfecta",
      "Bono facturado al cliente",
      "Bono por hallazgo",
      "Bono único",
      "Complemento de responsabilidades",
    ],
    active: true,
    repeatBatchOnEveryLine: false,
  },
  {
    id: "c-5170",
    humanCode: "5170",
    humanConcept: "Ayudas de transporte",
    bonusTypes: ["Ayuda de transporte"],
    active: true,
    repeatBatchOnEveryLine: false,
  },
];

const baseEmployeeSheets = basePeriods.reduce<Record<string, string[]>>((sheets, period) => {
  const numbers = baseRecords
    .filter((record) => record.periodId === period.id && record.employeeNumber)
    .map((record) => record.employeeNumber);
  sheets[period.id] = [...new Set(numbers)].filter((number) => !["", "241507", "243699"].includes(number));
  return sheets;
}, {});

const seed: DemoState = {
  periods: basePeriods,
  records: baseRecords,
  documents: baseDocuments,
  conceptMappings: baseConceptMappings,
  employeeSheets: baseEmployeeSheets,
  layoutVersions: [],
};
const storageKey = "intercon-bonos-demo-v1";

const repository = {
  load(): DemoState {
    if (typeof window === "undefined") return seed;
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : {};
    return {
      ...seed,
      ...parsed,
      conceptMappings: parsed.conceptMappings ?? seed.conceptMappings,
      employeeSheets: parsed.employeeSheets ?? seed.employeeSheets,
      layoutVersions: parsed.layoutVersions ?? seed.layoutVersions,
    };
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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const extractDigits = (value: string) => value.match(/\d+/)?.[0] ?? "";

const findConceptMapping = (record: BonusRecord, mappings: ConceptMapping[]) =>
  mappings.find(
    (mapping) =>
      mapping.active &&
      mapping.bonusTypes.some((type) => normalizeText(type) === normalizeText(record.bonusType)),
  );

const getPeriodDocuments = (state: DemoState, periodId: string) =>
  state.documents.filter((document) => document.periodId === periodId);

const validateLayoutMovements = (
  state: DemoState,
  period: Period,
  selectedIds: string[],
  form: LayoutForm,
): LayoutMovement[] => {
  const records = state.records.filter((record) => record.periodId === period.id);
  const selectedRecords = records.filter((record) => selectedIds.includes(record.id));
  const duplicateKeys = new Map<string, number>();
  selectedRecords.forEach((record) => {
    const mapping = findConceptMapping(record, state.conceptMappings);
    const key = [
      record.payrollType,
      record.period,
      record.employeeNumber,
      mapping?.humanCode ?? "",
      normalizeText(record.bonusType),
      record.installmentAmount.toFixed(2),
      record.installmentNumber,
      record.totalInstallments,
    ].join("|");
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  });

  return records.map((record) => {
    const selected = selectedIds.includes(record.id);
    const mapping = findConceptMapping(record, state.conceptMappings);
    const periodSheet = state.employeeSheets[period.id] ?? [];
    const confirmedEmployee = periodSheet.includes(record.employeeNumber) ? record.employeeNumber : "";
    const docs = getPeriodDocuments(state, record.periodId);
    const hasSupport =
      record.supports.length > 1 ||
      docs.some((document) => document.status === "Procesado" || document.status === "Firmado");
    const hasAuthorization =
      record.supports.some((support) => normalizeText(support).includes("firmado")) ||
      docs.some((document) => document.status === "Firmado" || normalizeText(document.name).includes("firmado"));
    const partialityOk =
      record.installmentNumber > 0 &&
      record.totalInstallments > 0 &&
      record.installmentNumber <= record.totalInstallments &&
      record.installmentAmount <= record.authorizedTotal;
    const duplicateKey = [
      record.payrollType,
      record.period,
      record.employeeNumber,
      mapping?.humanCode ?? "",
      normalizeText(record.bonusType),
      record.installmentAmount.toFixed(2),
      record.installmentNumber,
      record.totalInstallments,
    ].join("|");
    const blockingErrors = [
      !record.employeeNumber && "Número de empleado obligatorio",
      record.employeeNumber && !confirmedEmployee && "Empleado no localizado en la sábana del periodo",
      !mapping && "Concepto Human no homologado",
      !record.bonusType && "Descripción del bono obligatoria",
      (!Number.isFinite(record.installmentAmount) || record.installmentAmount <= 0) && "Importe numérico mayor que cero requerido",
      !record.payrollType && "Tipo de nómina definido requerido",
      !record.period && "Periodo validado requerido",
      (duplicateKeys.get(duplicateKey) ?? 0) > 1 && "Registro duplicado para Human",
      !partialityOk && "Parcialidad inválida",
      !hasSupport && "Soporte disponible requerido",
      !hasAuthorization && "Autorización disponible requerida",
      !form.batchId.trim() && "Lote de Human obligatorio",
    ].filter(Boolean) as string[];
    const warnings = [
      extractDigits(period.period) &&
        extractDigits(form.batchId) &&
        extractDigits(period.period) !== extractDigits(form.batchId) &&
        "El periodo seleccionado y el identificador del lote contienen números diferentes",
    ].filter(Boolean) as string[];
    const included = selected && blockingErrors.length === 0;
    return {
      record,
      selected,
      humanCode: mapping?.humanCode ?? "",
      humanConcept: mapping?.humanConcept ?? record.bonusType,
      confirmedEmployee,
      blockingErrors,
      warnings,
      included,
      exclusionReason: !selected ? "No seleccionado" : blockingErrors.join("; "),
    };
  });
};

const buildHumanColumns = (movement: LayoutMovement, batchId: string, index: number, repeatBatch: boolean) => {
  const columns = Array.from({ length: 20 }, () => "");
  columns[0] = movement.humanCode;
  columns[1] = movement.record.employeeNumber;
  columns[3] = movement.record.bonusType;
  columns[4] = movement.confirmedEmployee;
  columns[14] = movement.record.installmentAmount.toFixed(2);
  columns[19] = index === 0 || repeatBatch ? batchId : "";
  return columns;
};

const buildHumanTxt = (movements: LayoutMovement[], batchId: string, mappings: ConceptMapping[]) => {
  const repeatBatch = mappings.some((mapping) => mapping.repeatBatchOnEveryLine);
  return movements
    .filter((movement) => movement.included)
    .map((movement, index) => buildHumanColumns(movement, batchId, index, repeatBatch).join("\t"))
    .join("\r\n");
};

const validateTxtStructure = (txt: string) => {
  const lines = txt ? txt.split("\r\n") : [];
  const columnsOk = lines.every((line) => line.split("\t").length === 20);
  const amountOk = lines.every((line) => /^\d+\.\d{2}$/.test(line.split("\t")[14] ?? ""));
  const batchOk = lines.every((line, index) => {
    const value = line.split("\t")[19] ?? "";
    return index === 0 ? value.trim().length > 0 : value === "";
  });
  return { lines: lines.length, expectedColumns: 20, ok: lines.length > 0 && columnsOk && amountOk && batchOk };
};

const encodeLatin1 = (content: string) => {
  const bytes: number[] = [];
  for (let index = 0; index < content.length; index += 1) {
    const code = content.charCodeAt(index);
    const allowed = code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 255);
    bytes.push(allowed ? code & 0xff : 63);
  }
  return new Uint8Array(bytes);
};

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
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);
  const [layoutForm, setLayoutForm] = useState<LayoutForm>({
    payrollType: "Qna",
    year: 2026,
    period: "16",
    batchId: "BONOS QNA 16",
    responsible: "Miriam - Analista de Nóminas",
    generationDate: "2026-09-01",
  });
  const [layoutStatus, setLayoutStatus] = useState<LayoutStatus>("Borrador");
  const [lotConfirmed, setLotConfirmed] = useState(false);
  const [differenceConfirmed, setDifferenceConfirmed] = useState(false);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [loadHumanOpen, setLoadHumanOpen] = useState(false);
  const [loadForm, setLoadForm] = useState({
    loadedAt: "2026-09-01T16:30",
    user: "Miriam - Analista de Nóminas",
    result: "Carga exitosa",
    accepted: 0,
    rejected: 0,
    comments: "",
    evidence: "",
  });
  const [regenerationJustification, setRegenerationJustification] = useState("");

  useEffect(() => repository.save(state), [state]);

  const selectedPeriod = state.periods.find((period) => period.id === selectedPeriodId) ?? state.periods[0];
  const selectedRecords = state.records.filter((record) => record.periodId === selectedPeriod.id);
  const selectedDocuments = state.documents.filter((document) => document.periodId === selectedPeriod.id);
  const currentVersions = state.layoutVersions.filter((version) => version.periodId === selectedPeriod.id);
  const currentVersion = currentVersions.at(-1);
  const nextVersion = (currentVersion?.version ?? 0) + 1;
  const layoutMovements = validateLayoutMovements(state, selectedPeriod, selectedMovementIds, layoutForm);
  const selectedLayoutMovements = layoutMovements.filter((movement) => movement.selected);
  const includedMovements = layoutMovements.filter((movement) => movement.included);
  const excludedMovements = layoutMovements.filter((movement) => !movement.included);
  const blockingSelected = selectedLayoutMovements.filter((movement) => movement.blockingErrors.length > 0);
  const warningSelected = selectedLayoutMovements.filter((movement) => movement.warnings.length > 0);
  const generatedTxt = buildHumanTxt(layoutMovements, layoutForm.batchId, state.conceptMappings);
  const structure = validateTxtStructure(generatedTxt);
  const batchNumberWarning =
    extractDigits(selectedPeriod.period) &&
    extractDigits(layoutForm.batchId) &&
    extractDigits(selectedPeriod.period) !== extractDigits(layoutForm.batchId);
  const totalsByConcept = includedMovements.reduce<Record<string, number>>((totals, movement) => {
    const key = `${movement.humanCode} · ${movement.humanConcept}`;
    totals[key] = (totals[key] ?? 0) + movement.record.installmentAmount;
    return totals;
  }, {});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const recordsForPeriod = state.records.filter((record) => record.periodId === selectedPeriod.id);
      setSelectedMovementIds(recordsForPeriod.map((record) => record.id));
      setLayoutForm((current) => ({
        ...current,
        payrollType: selectedPeriod.payrollType,
        year: selectedPeriod.year,
        period: selectedPeriod.period,
        batchId: current.batchId || `BONOS ${selectedPeriod.payrollType.toUpperCase()} ${extractDigits(selectedPeriod.period) || selectedPeriod.period}`,
      }));
      setLotConfirmed(false);
      setDifferenceConfirmed(false);
      setLayoutStatus(currentVersion?.status ?? "Borrador");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedPeriod.id, selectedPeriod.payrollType, selectedPeriod.period, selectedPeriod.year, currentVersion?.status, state.records]);

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
    const usedBatch = state.layoutVersions.find(
      (version) => version.batchId === layoutForm.batchId && version.periodId !== selectedPeriod.id,
    );
    if (selectedPeriod.status !== "Validado" && selectedPeriod.status !== "Layout generado" && selectedPeriod.status !== "Cargado en Human") {
      setNotice("Primero valida el periodo antes de generar el layout Human.");
      return;
    }
    if (!layoutForm.batchId.trim()) {
      setNotice("El identificador del lote de Human es obligatorio.");
      return;
    }
    if (usedBatch) {
      setNotice("Ese lote ya fue utilizado en otro periodo. Captura un lote diferente.");
      return;
    }
    if (!lotConfirmed) {
      setNotice("Confirma el lote antes de generar el layout.");
      return;
    }
    if (batchNumberWarning && !differenceConfirmed) {
      setNotice("Confirma expresamente la diferencia entre periodo y lote antes de generar.");
      return;
    }
    if (currentVersion && !regenerationJustification.trim()) {
      setNotice("Captura una justificación para regenerar el layout.");
      return;
    }
    if (blockingSelected.length > 0) {
      setNotice("Hay errores bloqueantes entre los movimientos seleccionados. Desmárcalos o corrígelos.");
      return;
    }
    if (!structure.ok) {
      setNotice("La validación estructural del TXT no pasó. Revisa columnas, importes y lote.");
      return;
    }
    setConfirmGenerateOpen(true);
  };

  const confirmGenerateLayout = () => {
    mutate((draft) => {
      draft.layoutVersions.push({
        id: `lv-${Date.now()}`,
        periodId: selectedPeriod.id,
        version: nextVersion,
        status: nextVersion > 1 ? "Regenerado" : "Layout generado",
        batchId: layoutForm.batchId,
        payrollType: layoutForm.payrollType,
        year: layoutForm.year,
        period: layoutForm.period,
        responsible: layoutForm.responsible,
        generatedAt: layoutForm.generationDate,
        included: includedMovements.length,
        excluded: excludedMovements.length,
        employees: new Set(includedMovements.map((movement) => movement.record.employeeNumber)).size,
        amount: includedMovements.reduce((sum, movement) => sum + movement.record.installmentAmount, 0),
        structuralValid: structure.ok,
        justification: nextVersion > 1 ? regenerationJustification : undefined,
      });
      const period = draft.periods.find((item) => item.id === selectedPeriod.id);
      if (period) {
        period.status = nextVersion > 1 ? "Layout generado" : "Layout generado";
        period.history.unshift(
          `${new Date().toLocaleString("es-MX")}: Layout Human v${nextVersion} generado con lote ${layoutForm.batchId}, ${includedMovements.length} movimientos, ${money(includedMovements.reduce((sum, movement) => sum + movement.record.installmentAmount, 0))}.`,
        );
        if (batchNumberWarning) {
          period.history.unshift(
            `${new Date().toLocaleString("es-MX")}: Se confirmó diferencia entre periodo ${selectedPeriod.period} y lote ${layoutForm.batchId}.`,
          );
        }
      }
      return draft;
    }, `Layout Human v${nextVersion} generado.`);
    setLayoutStatus(nextVersion > 1 ? "Regenerado" : "Layout generado");
    setConfirmGenerateOpen(false);
    setRegenerationJustification("");
  };

  const registerHuman = () => {
    setLoadForm((current) => ({
      ...current,
      accepted: includedMovements.length,
      rejected: 0,
    }));
    setLoadHumanOpen(true);
  };

  const closePeriod = () => {
    updatePeriodStatus(selectedPeriod.id, "Cerrado", "Periodo cerrado con trazabilidad completa.");
  };

  const confirmHumanLoad = () => {
    mutate((draft) => {
      const period = draft.periods.find((item) => item.id === selectedPeriod.id);
      const version = draft.layoutVersions.filter((item) => item.periodId === selectedPeriod.id).at(-1);
      if (period) {
        period.status = "Cargado en Human";
        period.history.unshift(
          `${new Date().toLocaleString("es-MX")}: Carga a Human registrada por ${loadForm.user}. Resultado: ${loadForm.result}. Aceptados: ${loadForm.accepted}. Rechazados: ${loadForm.rejected}. ${loadForm.comments}`,
        );
      }
      if (version) {
        version.status = "Cargado en Human";
        version.loadResult = loadForm.result;
        version.loadComments = loadForm.comments;
      }
      if (loadForm.result !== "Carga exitosa") {
        draft.records = draft.records.map((record) =>
          selectedMovementIds.includes(record.id) ? { ...record, status: "Observado", validationResult: "Con observaciones" } : record,
        );
      }
      return draft;
    }, "Carga a Human registrada en historial.");
    setLayoutStatus("Cargado en Human");
    setLoadHumanOpen(false);
  };

  const download = (filename: string, content: string | Uint8Array, type = "text/plain") => {
    const parts: BlobPart[] = typeof content === "string" ? [content] : [content.slice().buffer as ArrayBuffer];
    const blob = new Blob(parts, { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${filename} descargado.`);
  };

  const csv = [
    "folio,anio,tipo_nomina,periodo,lote,version,codigo_human,numero_empleado,descripcion_bono,importe,parcialidad,estado_validacion,incluido_excluido,motivo_exclusion,responsable,fecha_generacion",
    ...layoutMovements.map((movement) =>
      [
        movement.record.folio,
        movement.record.year,
        layoutForm.payrollType,
        layoutForm.period,
        layoutForm.batchId,
        currentVersion?.version ?? nextVersion,
        movement.humanCode,
        movement.record.employeeNumber,
        movement.record.bonusType,
        movement.record.installmentAmount.toFixed(2),
        `${movement.record.installmentNumber}/${movement.record.totalInstallments}`,
        movement.blockingErrors.length ? "Error bloqueante" : movement.warnings.length ? "Advertencia" : "Correcto",
        movement.included ? "Incluido" : "Excluido",
        movement.exclusionReason,
        layoutForm.responsible,
        layoutForm.generationDate,
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
                <p>TXT real delimitado por tabuladores, sin encabezados, 20 columnas y lote solo en primera línea.</p>
              </div>
              <div className="actions">
                <Action onClick={() => {
                  setLayoutStatus(blockingSelected.length ? "Pendiente de validación" : "Listo para generar");
                  setNotice(blockingSelected.length ? "Validación terminada con errores bloqueantes." : "Movimientos validados. El layout está listo para generar.");
                }} icon={ShieldCheck} label="Validar movimientos" secondary />
                <Action onClick={() => {
                  if (!layoutForm.batchId.trim()) {
                    setNotice("Captura el identificador del lote de Human.");
                    return;
                  }
                  setLotConfirmed(true);
                  setNotice(`Lote ${layoutForm.batchId} confirmado para ${layoutForm.payrollType} ${layoutForm.period}.`);
                  mutate((draft) => {
                    const period = draft.periods.find((item) => item.id === selectedPeriod.id);
                    period?.history.unshift(`${new Date().toLocaleString("es-MX")}: Lote Human confirmado: ${layoutForm.batchId}.`);
                    return draft;
                  }, `Lote ${layoutForm.batchId} confirmado.`);
                }} icon={BadgeCheck} label="Confirmar lote" secondary />
                {role === "Miriam" && <Action onClick={generateLayout} icon={FileSpreadsheet} label={currentVersion ? "Regenerar layout" : "Generar layout"} />}
                <Action
                  onClick={() =>
                    currentVersion && structure.ok
                      ? download(
                          layoutFileName(layoutForm),
                          encodeLatin1(generatedTxt),
                          "text/plain;charset=ISO-8859-1",
                        )
                      : setNotice("Genera primero una versión válida del layout antes de descargar el TXT.")
                  }
                  icon={Download}
                  label="Descargar TXT"
                  secondary
                />
                <Action onClick={() => currentVersion ? download(`CONCENTRADO_${selectedPeriod.payrollType}_${selectedPeriod.period}_v${currentVersion.version}.csv`, csv, "text/csv") : setNotice("Genera primero el layout para descargar el concentrado.")} icon={Download} label="Descargar concentrado" secondary />
              </div>
            </div>
            <div className="layout-form">
              <label>Tipo de nómina<select value={layoutForm.payrollType} onChange={(event) => setLayoutForm({ ...layoutForm, payrollType: event.target.value })}>{["Qna", "Sem II", "IC ADMIN", "Reclamos"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Año<input type="number" value={layoutForm.year} onChange={(event) => setLayoutForm({ ...layoutForm, year: Number(event.target.value) })} /></label>
              <label>Periodo<input value={layoutForm.period} onChange={(event) => setLayoutForm({ ...layoutForm, period: event.target.value })} /></label>
              <label>Lote Human<input value={layoutForm.batchId} onChange={(event) => { setLayoutForm({ ...layoutForm, batchId: event.target.value }); setLotConfirmed(false); setDifferenceConfirmed(false); }} placeholder="BONOS SEM II 33" /></label>
              <label>Responsable<input value={layoutForm.responsible} onChange={(event) => setLayoutForm({ ...layoutForm, responsible: event.target.value })} /></label>
              <label>Fecha de generación<input type="date" value={layoutForm.generationDate} onChange={(event) => setLayoutForm({ ...layoutForm, generationDate: event.target.value })} /></label>
            </div>
            {batchNumberWarning && (
              <div className="warning-box">
                <AlertCircle size={18} />
                <span>El periodo seleccionado y el identificador del lote contienen números diferentes. Confirma que el lote corresponde al proceso de Human antes de continuar.</span>
                <button onClick={() => setDifferenceConfirmed(true)}>{differenceConfirmed ? "Diferencia confirmada" : "Confirmar diferencia"}</button>
              </div>
            )}
            <div className="kpi-grid compact">
              <Kpi icon={CheckCircle2} label="Movimientos incluidos" value={includedMovements.length} />
              <Kpi icon={AlertCircle} label="Movimientos excluidos" value={excludedMovements.length} />
              <Kpi icon={UserRoundCog} label="Empleados únicos" value={new Set(includedMovements.map((movement) => movement.record.employeeNumber)).size} />
              <Kpi icon={BriefcaseBusiness} label="Importe total" value={money(includedMovements.reduce((sum, movement) => sum + movement.record.installmentAmount, 0))} />
              <Kpi icon={ShieldCheck} label="Estado layout" value={currentVersion?.status ?? layoutStatus} />
              <Kpi icon={FileSpreadsheet} label="Versión" value={`v${currentVersion?.version ?? nextVersion}`} />
              <Kpi icon={AlertCircle} label="Errores bloqueantes" value={blockingSelected.length} />
              <Kpi icon={AlertCircle} label="Advertencias" value={warningSelected.length} />
            </div>
            <div className="two-columns">
              <Panel title="Totales por concepto">
                <div className="totals-list">
                  {Object.entries(totalsByConcept).map(([key, value]) => <div key={key}><span>{key}</span><strong>{money(value)}</strong></div>)}
                  {!Object.keys(totalsByConcept).length && <p className="empty-note">No hay movimientos incluidos.</p>}
                </div>
              </Panel>
              <Panel title="Versiones anteriores">
                <div className="version-list">
                  {currentVersions.map((version) => (
                    <div key={version.id}>
                      <strong>v{version.version} · {version.batchId}</strong>
                      <small>{version.status} · {version.included} movimientos · {money(version.amount)}</small>
                    </div>
                  ))}
                  {!currentVersions.length && <p className="empty-note">Aún no hay versiones generadas.</p>}
                  {currentVersion && (
                    <label className="regen-field">Justificación para regenerar<textarea value={regenerationJustification} onChange={(event) => setRegenerationJustification(event.target.value)} placeholder="Motivo de la nueva versión" /></label>
                  )}
                </div>
              </Panel>
            </div>
            <LayoutMovementTable movements={layoutMovements} selectedIds={selectedMovementIds} setSelectedIds={setSelectedMovementIds} />
            <Panel title="Vista previa TXT">
              <div className="preview-meta">
                <span>Total de líneas: {structure.lines}</span>
                <span>Columnas esperadas: {structure.expectedColumns}</span>
                <StatusChip value={structure.ok ? "Correcto" : "Con observaciones"} />
              </div>
              <pre className="txt-preview">{previewTxt(generatedTxt)}</pre>
            </Panel>
            <div className="actions">
              {role === "Miriam" && currentVersion && <Action onClick={registerHuman} icon={Upload} label="Marcar como cargado en Human" />}
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
            <Panel title="Relación editable tipo de bono / concepto Human">
              <div className="mapping-grid">
                {state.conceptMappings.map((mapping) => (
                  <div key={mapping.id} className="mapping-row">
                    <label>Código Human<input value={mapping.humanCode} onChange={(event) => mutate((draft) => {
                      draft.conceptMappings = draft.conceptMappings.map((item) => item.id === mapping.id ? { ...item, humanCode: event.target.value } : item);
                      return draft;
                    }, "Catálogo Human actualizado.")} /></label>
                    <label>Concepto<input value={mapping.humanConcept} onChange={(event) => mutate((draft) => {
                      draft.conceptMappings = draft.conceptMappings.map((item) => item.id === mapping.id ? { ...item, humanConcept: event.target.value } : item);
                      return draft;
                    }, "Catálogo Human actualizado.")} /></label>
                    <label>Tipos de bono homologados<textarea value={mapping.bonusTypes.join("\n")} onChange={(event) => mutate((draft) => {
                      draft.conceptMappings = draft.conceptMappings.map((item) => item.id === mapping.id ? { ...item, bonusTypes: event.target.value.split("\n").filter(Boolean) } : item);
                      return draft;
                    }, "Catálogo Human actualizado.")} /></label>
                  </div>
                ))}
              </div>
            </Panel>
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

      {confirmGenerateOpen && (
        <div className="modal-backdrop">
          <button className="backdrop-close" aria-label="Cancelar generación" onClick={() => setConfirmGenerateOpen(false)} />
          <section className="confirm-modal">
            <h3>Confirmar generación de layout</h3>
            <p>Estás por generar el layout para Human. Confirma que el tipo de nómina, periodo, lote, número de movimientos e importe total sean correctos. Una vez generado, esta versión quedará registrada en el historial del periodo.</p>
            <div className="confirm-grid">
              <span>Tipo de nómina<strong>{layoutForm.payrollType}</strong></span>
              <span>Periodo<strong>{layoutForm.period}</strong></span>
              <span>Lote<strong>{layoutForm.batchId}</strong></span>
              <span>Movimientos incluidos<strong>{includedMovements.length}</strong></span>
              <span>Empleados únicos<strong>{new Set(includedMovements.map((movement) => movement.record.employeeNumber)).size}</strong></span>
              <span>Importe total<strong>{money(includedMovements.reduce((sum, movement) => sum + movement.record.installmentAmount, 0))}</strong></span>
              <span>Movimientos excluidos<strong>{excludedMovements.length}</strong></span>
              <span>Advertencias<strong>{warningSelected.length}</strong></span>
              <span>Versión<strong>v{nextVersion}</strong></span>
            </div>
            <div className="drawer-actions">
              <button onClick={confirmGenerateLayout}>Confirmar y generar</button>
              <button onClick={() => setConfirmGenerateOpen(false)}>Cancelar</button>
            </div>
          </section>
        </div>
      )}

      {loadHumanOpen && (
        <div className="modal-backdrop">
          <button className="backdrop-close" aria-label="Cancelar registro de carga" onClick={() => setLoadHumanOpen(false)} />
          <form className="drawer" onSubmit={(event) => event.preventDefault()}>
            <header><span><strong>Registro de carga a Human</strong><small>Lote {layoutForm.batchId}</small></span></header>
            <label>Fecha y hora de carga<input type="datetime-local" value={loadForm.loadedAt} onChange={(event) => setLoadForm({ ...loadForm, loadedAt: event.target.value })} /></label>
            <label>Usuario responsable<input value={loadForm.user} onChange={(event) => setLoadForm({ ...loadForm, user: event.target.value })} /></label>
            <label>Resultado<select value={loadForm.result} onChange={(event) => setLoadForm({ ...loadForm, result: event.target.value })}>{["Carga exitosa", "Carga parcial", "Carga rechazada"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Movimientos aceptados<input type="number" value={loadForm.accepted} onChange={(event) => setLoadForm({ ...loadForm, accepted: Number(event.target.value) })} /></label>
            <label>Movimientos rechazados<input type="number" value={loadForm.rejected} onChange={(event) => setLoadForm({ ...loadForm, rejected: Number(event.target.value) })} /></label>
            <label>Comentarios<textarea value={loadForm.comments} onChange={(event) => setLoadForm({ ...loadForm, comments: event.target.value })} /></label>
            <label>Evidencia opcional<input value={loadForm.evidence} onChange={(event) => setLoadForm({ ...loadForm, evidence: event.target.value })} placeholder="Nombre de archivo o folio de evidencia" /></label>
            <div className="drawer-actions">
              <button onClick={confirmHumanLoad}>Registrar carga</button>
              <button onClick={() => setLoadHumanOpen(false)}>Cancelar</button>
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
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

function LayoutMovementTable({
  movements,
  selectedIds,
  setSelectedIds,
}: {
  movements: LayoutMovement[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incluir</th>
            <th>Concepto Human</th>
            <th>Empleado</th>
            <th>Descripción</th>
            <th>Importe</th>
            <th>Parcialidad</th>
            <th>Resultado de validación</th>
            <th>Motivo de exclusión</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.record.id}>
              <td>
                <input
                  aria-label={`Incluir ${movement.record.folio}`}
                  type="checkbox"
                  checked={selectedIds.includes(movement.record.id)}
                  onChange={() => toggle(movement.record.id)}
                />
              </td>
              <td><strong>{movement.humanCode || "Sin homologar"}</strong><small>{movement.humanConcept}</small></td>
              <td><strong>{movement.record.name}</strong><small>{movement.record.employeeNumber || "Sin número"} · Sábana: {movement.confirmedEmployee || "No localizado"}</small></td>
              <td>{movement.record.bonusType}</td>
              <td>{money(movement.record.installmentAmount)}</td>
              <td>{movement.record.installmentNumber}/{movement.record.totalInstallments}</td>
              <td><StatusChip value={movement.blockingErrors.length ? "No procesado" : movement.warnings.length ? "Con observaciones" : "Correcto"} /></td>
              <td>{movement.exclusionReason || movement.warnings.join("; ") || "Incluido"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function layoutFileName(form: LayoutForm) {
  return `LAYOUT_${form.payrollType.replaceAll(" ", "_").toUpperCase()}_${form.period.replaceAll(" ", "_")}_${form.batchId.replaceAll(" ", "_")}.txt`;
}

function previewTxt(txt: string) {
  if (!txt) return "No hay movimientos válidos seleccionados para previsualizar.";
  const lines = txt.split("\r\n");
  const visible = lines.length > 10 ? [...lines.slice(0, 5), "...", ...lines.slice(-5)] : lines;
  return visible.map((line) => line === "..." ? line : line.split("\t").map((column) => column || "∅").join("  ⇥  ")).join("\n");
}
