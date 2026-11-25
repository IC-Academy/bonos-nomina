# Módulo HUMAN

Validación de registros, generación y verificación del archivo TXT para el sistema de nómina HUMAN. Es TypeScript puro: no depende de React, del navegador ni de Node, así que puede usarse en el frontend, en un backend (n8n, Azure Functions) o en pruebas.

> **Estado: PROVISIONAL.** El orden de las 20 columnas viene del prototipo v1 (commit `e253bba`) y no se ha comparado contra un TXT aceptado por HUMAN. `HUMAN_LAYOUT_MAPPING_STATUS` vale `"provisional"` hasta que esa comparación salga idéntica. No usar para una carga real.

## Uso

```ts
import { validateLayoutMovements, buildHumanFile, validateTxtStructure } from "@/lib/human";

const movements = validateLayoutMovements({
  period, records, selectedIds, conceptMappings, employeeSheet, documents,
  form: { batchId: "SEM38-01" },
});
const file = buildHumanFile(movements, "SEM38-01", conceptMappings); // { text, bytes, lines }
const report = validateTxtStructure(file.text);
```

`buildHumanFile` lanza `Latin1EncodingError` (con línea, columna y código de cada carácter) si algo no cabe en ISO-8859-1, y `HumanLayoutError` si no hay movimientos incluidos o un campo trae tabulador o salto de línea.

## Archivos

| Archivo | Contenido | Origen en v1 |
| --- | --- | --- |
| `types.ts` | Tipos de entrada y salida | Tipos de `app/page.tsx` |
| `layout-spec.ts` | Formato y mapeo provisional de columnas | `buildHumanColumns` |
| `validate-movements.ts` | 14 reglas bloqueantes y 1 advertencia | `validateLayoutMovements` |
| `build-txt.ts` | Construcción del TXT y de los bytes | `buildHumanColumns`, `buildHumanTxt` |
| `encoding.ts` | ISO-8859-1 estricto | `encodeLatin1` |
| `structure.ts` | Verificación de un TXT ya generado | `validateTxtStructure` |
| `compare.ts` | Comparación contra un TXT aceptado | Nuevo |
| `text.ts` | Normalización y formato de importes | `normalizeText`, `extractDigits` |

## Cambios respecto a v1

- **Sin sustitución silenciosa.** v1 cambiaba por `?` todo carácter fuera de Latin-1. Ahora se rechaza y se informa dónde está. También se rechazan los controles 0x7F–0x9F, que v1 dejaba pasar.
- **Sin redondeo silencioso.** Un importe con más de 2 decimales es error bloqueante; la regla de redondeo no está definida.
- **Campos con tabulador o salto de línea** son error bloqueante: romperían las columnas.
- **Advertencia de lote**: compara números como enteros. En v1, `SEM II 038` contra `SEM38-01` advertía por `038` ≠ `38`.
- **Verificación estructural** devuelve la lista de problemas por línea, detecta saltos LF o CR sueltos y caracteres incompatibles.
- Las entradas (sábana, documentos) se reciben como parámetros en lugar de leer el estado demo.

## Pendiente de confirmar con Nóminas

1. Orden exacto de las 20 columnas y valores constantes en las 14 que hoy van vacías.
2. Si la columna 5 repite el número de empleado (v1 lo hace) o es otro campo.
3. Si el lote va solo en la primera línea o en todas.
4. Si HUMAN espera CRLF después de la última línea.
5. Longitudes máximas por campo y regla de redondeo.
6. Nombre del archivo.
7. Catálogo oficial de conceptos (los códigos de las pruebas son ficticios).
8. Si la llave de duplicidad debe incluir el importe (v1 lo incluye, así que mismo empleado y concepto con distinto importe no se marca).

Cuando llegue un TXT aceptado, se genera el mismo periodo con datos equivalentes y se pasa por `compareWithAcceptedTxt(generado, aceptado)`. `columnsWithDifferences` dice qué columnas corregir en `layout-spec.ts`. El archivo histórico no se sube al repositorio.

## Pruebas

```bash
npm run test:human
```

Usa el runner nativo de Node (22.18 o superior), sin dependencias nuevas. Los datos de prueba son sintéticos: números de empleado 900000–900999 y conceptos 1000/2000/3000.
