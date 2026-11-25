# Contrato API requerido por el frontend — PROPUESTA

> **Estado: propuesta.** Describe *qué* necesita cada módulo de la interfaz, no *cómo* se expone.
> No hay endpoints productivos definidos. Backend previsto: n8n Cloud + SharePoint (sitio Desarrollo) con
> autenticación corporativa Entra ID, sujeto a autorización de TI. El modelo de datos, las reglas de
> negocio y el generador HUMAN se definen en paralelo; este documento debe alinearse con ellos.

Código fuente del contrato: `src/api/contracts/*.ts` (interfaz `BonosApi`). Tipos de dominio: `src/domain/types.ts`.

## Reglas generales

- **Autenticación**: toda operación se ejecuta con la identidad del usuario (token Entra ID). El frontend nunca guarda credenciales; `src/api/http.ts` acepta un `getAccessToken()`.
- **Autorización**: los permisos de `src/domain/permissions.ts` sólo ocultan controles. El backend debe validar rol en cada escritura.
- **Errores**: el adaptador productivo debe traducir respuestas a `ApiError` (`src/api/errors.ts`): `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409, p. ej. periodo cerrado), `validation` (400/422), `server` (5xx), `network`, `timeout`.
- **Reintentos**: las lecturas se reintentan 2 veces con espera exponencial sólo si el error es `network`, `timeout` o `server`. Las escrituras **no** se reintentan solas; el usuario decide.
- **Bitácora**: toda escritura (decisión, extensión, cierre, reapertura, cambios de usuario) debe registrarse en el backend (lista `Bonos_Bitacora`). El frontend no escribe bitácora directamente.
- **Identificadores**: siempre cadenas (`string`), incluido el número de empleado.

## Operaciones por módulo

Las columnas "Fuente probable" son orientativas (listas confirmadas en SharePoint); el mapeo real lo define el modelo de datos.

### Transversal — Sesión (`SessionApi`)
| Operación | Entrada | Salida | Fuente probable |
|---|---|---|---|
| `getCurrentSession()` | token | `Session { user: AppUser, role, expiresAt? }` | Entra ID + `Bonos_Usuarios` |
| `signOut()` | — | — | Entra ID |

Si no hay sesión debe fallar con `unauthorized`; la app muestra la pantalla de inicio de sesión.

### Transversal — Periodo (`PeriodsApi`)
| Operación | Entrada | Salida | Rol mínimo (UI) |
|---|---|---|---|
| `getActivePeriod()` | — | `Period { id, label, title, version, status, deadlineLabel }` | todos |
| `deliverToPayroll(periodId)` | id | `Period` | todos |
| `createExtension(periodId)` | id | `Period` (version + 1) | Admin |
| `closeValidation(periodId)` | id | `Period` (status `cerrado`); `conflict` si hay movimientos sin decisión | Admin |
| `reopen(periodId, justification)` | id, texto obligatorio | `Period` | Super Admin |

Fuente probable: `Bonos_Periodos`.

### 1. Resumen (`DashboardApi.getSummary`)
Entrada `periodId`. Salida `DashboardSummary { totalMovements, amount, needsReview, withSupport, sampleSize, differences, missingSupport }`. Se recarga tras cada decisión.

### 1b. Comparativos (`DashboardApi`)
| Operación | Entrada | Salida |
|---|---|---|
| `listComparablePeriods()` | — | `string[]` |
| `getComparison({ basePeriod, range })` | `range`: Mes anterior · Trimestre · Semestre · Año | `ComparisonResult` (importes, movimientos, aceptados y desglose por concepto) |
| `exportComparison({ basePeriod, range })` | igual | `Blob` (CSV/Excel) |

Fuente probable: agregados de `Bonos_Movimientos` (posible Fabric).

### 2. Bandeja de bonos (`MovementsApi.list`)
Entrada `{ periodId, query?, status? }`. Salida `Movement[]`. Hoy el filtrado es local; si el volumen lo exige, el backend debe aceptar `query`/`status` y paginar (pendiente: definir paginación). Usa además `periods.createExtension` y `periods.deliverToPayroll`.

Fuente probable: `Bonos_Movimientos` + `Bonos_Conceptos`.

### 3. Centro de validación (`MovementsApi`)
| Operación | Entrada | Salida |
|---|---|---|
| `getEvidence(movementId, type)` | `asistencia` · `matriz` · `soporte` | `AttendanceEvidence` · `RuleEvidence` · `SupportEvidence` |
| `decide({ movementId, decision, justification?, exception? })` | `decision`: Aprobado · Revisión · Rechazado | `Movement` actualizado |
| `requestSupport(movementId)` | id | — |
| `getSupportUrl(documentId)` | id | URL temporal de lectura |

Reglas que hoy aplica la UI (deben replicarse en backend): aprobar sin soporte exige justificación y marca `exception = true`. La evidencia de asistencia viene hoy simulada; su fuente real (ICON) está pendiente. Fuente probable: `Bonos_Autorizaciones`, `Bonos_Soportes`, `Bonos_Bitacora`.

### 4. Matriz de bonos (`MatrixApi`)
| Operación | Entrada | Salida |
|---|---|---|
| `listRules()` | — | `BonusRule[]` |
| `importMatrix(file)` | archivo de la matriz autorizada | `{ version }` |

"Nuevo bono" queda sin operación hasta cerrar el modelo de datos de la matriz. Fuente probable: `Bonos_Conceptos` (hoy 4 registros).

### 5. Histórico (`HistoryApi`)
`search(HistorySearch)` → `Movement[]`; `export(HistorySearch)` → `Blob`. Filtros: `query`, `periodId`, `client`, `site`, `bonus`. Pendiente: paginación.

### 6. Conciliación (`ReconciliationApi.getSummary`)
Entrada `periodId`. Salida `ReconciliationSummary { detected, registered, delivered, withSupport, supportBase, pending[] }`. Requiere la fuente de correo recibido (n8n) cruzada con `Bonos_Movimientos` y `Bonos_Soportes`.

### 7. Layout Human (`HumanLayoutApi`)
| Operación | Entrada | Salida |
|---|---|---|
| `getPreview(periodId)` | id | `HumanLayoutPreview { approved, excluded, suggestedLot, structureLabel, encodingLabel, previewLines[] }` |
| `generate({ periodId, lotId })` | id, lote | `{ fileName, file: Blob }` |

El frontend **no** arma el TXT: el orden de las 20 columnas, la codificación y la validación pertenecen al generador HUMAN (provisional hasta tener un TXT histórico aceptado). Sólo se habilita con el periodo cerrado.

### 8. Administración (`AdminApi`)
| Operación | Entrada | Salida | Rol |
|---|---|---|---|
| `listUsers()` | — | `AppUser[]` | Super Admin |
| `addUser({ displayName, role })` | — | `AppUser` | Super Admin |
| `updateRole(userId, role)` | — | `AppUser` | Super Admin |
| `removeUser(userId)` | — | — | Super Admin |

Pendiente: el alta real debe resolver la identidad corporativa (UPN/objeto Entra ID) en el backend; el frontend no maneja correos. Fuente probable: `Bonos_Usuarios`.

## Preguntas abiertas
1. ¿`Usuario` puede decidir movimientos y editar la matriz? El prototipo lo permite; la tabla de permisos dice "carga, consulta y entrega". Se conservó el comportamiento.
2. Paginación y volumen esperado por periodo (236 movimientos semanales en la demo).
3. Fuente y formato de la evidencia de asistencia (ICON).
4. Transporte de archivos (soportes, matriz, TXT): URL firmada de SharePoint o binario vía n8n.
