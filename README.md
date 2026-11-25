# Inter-Con México | Bonos de Nómina

Frontend para la automatización del proceso de bonos de nómina (ABM → Nóminas → Human → Cierre).
Hoy funciona en **modo demo** con datos ficticios; está preparado para conectarse a un backend
productivo (previsto: n8n Cloud + SharePoint + Entra ID) sin cambiar la interfaz.

## Módulos

Resumen y comparativos · Bandeja de bonos · Centro de validación · Matriz de bonos · Histórico ·
Conciliación · Layout Human · Administración.

## Modos de datos

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_DATA_MODE` | `demo` (por defecto) · `api` | `demo` carga en diferido el adaptador con datos ficticios. `api` usa el adaptador productivo; mientras no existan endpoints, cada módulo muestra "Integración pendiente". |
| `VITE_API_BASE_URL` | URL | Base del backend, cuando exista. |

Ver `.env.example`. No pongas secretos en variables `VITE_*`: terminan en el navegador.

## Estructura

```
app/                 entrada vinext (page.tsx → src/App) y estilos existentes
src/main.tsx         entrada Vite (GitHub Pages)
src/App.tsx          proveedores + shell
src/api/contracts/   contrato API por módulo (PROPUESTA)
src/api/adapters/    demo (datos ficticios) y unconfigured (modo productivo sin backend)
src/api/http.ts      transporte HTTP genérico (token, timeout, errores)
src/api/errors.ts    ApiError y mensajes al usuario
src/api/retry.ts     reintentos con espera exponencial
src/session/         sesión y permisos de interfaz
src/state/           estado compartido (periodo, movimientos, avisos)
src/hooks/           useResource (carga + reintentos) y useMutation
src/domain/          tipos y lógica pura (sin React)
src/components/      layout y componentes compartidos
src/modules/         una carpeta por módulo
docs/contrato-api-frontend.md   contrato requerido por cada módulo
```

## Desarrollo

```bash
npm install
npm run dev           # vinext
npm run build:pages   # build Vite que publica GitHub Pages
npm run build         # build vinext
npx tsc --noEmit      # verificación de tipos
```

## Datos

El repositorio es público. Los datos demo son ficticios (`Colaborador Demo 01`, `E-10001`, `Cliente A`…).
No subir nombres, números de empleado, clientes, importes reales ni credenciales.
