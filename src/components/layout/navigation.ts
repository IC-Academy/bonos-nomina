import { Database, FileText, GitCompareArrows, History, Inbox, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import type { View } from "../../domain/types";

export const NAV: readonly { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "inicio", label: "Resumen", icon: LayoutDashboard },
  { id: "bandeja", label: "Bandeja de bonos", icon: Inbox },
  { id: "validacion", label: "Centro de validación", icon: ShieldCheck },
  { id: "matriz", label: "Matriz de bonos", icon: Database },
  { id: "historico", label: "Histórico", icon: History },
  { id: "conciliacion", label: "Conciliación", icon: GitCompareArrows },
  { id: "layout", label: "Layout Human", icon: FileText },
  { id: "admin", label: "Administración", icon: Users },
];

export const viewLabel = (view: View) => NAV.find((n) => n.id === view)?.label ?? "";

