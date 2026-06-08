# Zona horaria y DST (Europe/Madrid)

**Última actualización:** 2026-06-08
**Implementación:** `src/utils/timezone.ts`
**Tests:** `src/utils/timezone.test.ts`
**Estado:** Resuelto

---

## Contexto

España cambia de hora dos veces al año:

- **Último domingo de marzo** — los relojes avanzan de 02:00 a 03:00 (CET UTC+1 → CEST UTC+2)
- **Último domingo de octubre** — los relojes retroceden de 03:00 a 02:00 (CEST UTC+2 → CET UTC+1)

El problema original: el código calculaba la hora con `new Date().getHours()`, que devuelve la hora del **reloj del sistema operativo del navegador**. Eso es casi siempre correcto en las terminales del laboratorio en España, pero no está garantizado: una VM, un contenedor Docker, un runner de CI o un usuario que haya cambiado su reloj pueden producir un offset distinto.

---

## Solución

Toda la lógica de tiempo sensible a la zona horaria está centralizada en `src/utils/timezone.ts`. La zona se fija explícitamente a `Europe/Madrid` mediante `Intl.DateTimeFormat`, que se apoya en la base de datos IANA (tzdata) incluida en el motor del navegador (V8, SpiderMonkey, WebKit). Las transiciones de DST (CET↔CEST) se gestionan **automáticamente**, sin añadir ninguna dependencia externa.

### Decisiones de diseño

1. Se usa `Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'` en lugar del reloj del SO, para que el resultado no dependa de la configuración de la máquina cliente.
2. Se evita `Date.prototype.toLocaleString` para lógica, porque su formato de salida depende del locale y no es fiable para parsear.
3. Se usa `formatToParts` para extracción legible por máquina. Disponible en Chrome 57+, Firefox 51+ y Safari 11+ (cualquier Chrome moderno de las terminales del laboratorio lo soporta).
4. El formatter es un **singleton** — crear instancias de `DateTimeFormat` es costoso, así que se reutiliza.

### API pública

| Función | Devuelve | Reemplaza a |
|---|---|---|
| `nowMadridMinutes()` | Minutos transcurridos desde medianoche en Madrid (con segundos como fracción) | `now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60` |
| `todayMadrid()` | Fecha de hoy en Madrid como `"YYYY-MM-DD"` | `toLocaleDateString('en-CA')` / `toISOString().slice(0,10)` (ambos incorrectos) |
| `nowMadridHHMM()` | `{ hours, minutes }` en Madrid | — (expuesto para depuración y tests) |

`todayMadrid()` es seguro al cruzar medianoche y en transiciones de DST: usa la fecha de pared (wallclock) de Madrid, no la fecha UTC.

---

## Qué consume estos helpers

- `src/components/admin/Temporizadores.tsx` → usa `todayMadrid()`
- `src/hooks/useCalculatedRemainingSeconds.ts` → usa `nowMadridMinutes()`
- `src/hooks/useCurrentActiveTimer.ts` → usa `nowMadridMinutes()`
- `src/utils/time.ts` (`parseInicio`) → solo hace split de strings, sin lógica de zona horaria; el llamador es responsable de comparar contra `nowMadridMinutes()`

---

## Cobertura de tests

`src/utils/timezone.test.ts` verifica la salida en hora de Madrid (no UTC), fijando el reloj con fechas de referencia conocidas:

- **Invierno (CET, UTC+1):** 10:30, 00:00, 23:59:59 y segundos como fracción
- **Verano (CEST, UTC+2):** 10:30, 00:00, 23:00
- **Spring-forward (2024-03-31):** lee 01:59 CET antes del salto, 03:00 CEST justo después, y confirma que la hora fantasma 02:30 no existe (el reloj salta 61 min)
- **Fall-back (2024-10-27):** verifica las dos pasadas por las 02:xx

---

## Edge cases de DST (documentados, no manejados en código)

### Hora fantasma (spring-forward)

El último domingo de marzo, las horas entre 02:00 y 03:00 **no existen** en Europe/Madrid. Un timer programado a las 02:30 se tratará como activo a partir de ~02:00 hora de Madrid (cuando el reloj salta).

### Hora ambigua (fall-back)

El último domingo de octubre, las horas entre 02:00 y 03:00 **ocurren dos veces**. Un timer a las 02:30 aparecerá activo durante ~2× su duración configurada.

**Mitigación actual:** ambos casos son una cuestión administrativa. Afectan como mucho a dos domingos al año y a cero sesiones de laboratorio reales (los labs no se ejecutan a las 02:30 AM). Por eso están fuera del alcance de v2.

**Acción futura (opcional):** avisar al admin si la hora introducida cae en el hueco DST de marzo, o preguntar qué ocurrencia usar en el caso de octubre.

---

## Nota histórica

Una iteración previa de este documento describía una solución basada en **Luxon** (`DateTime.fromISO`, `setZone`) y un bug en `src/views/TemporizadoresView.tsx`. Esa ruta fue descartada: el proyecto **no usa Luxon** y `TemporizadoresView.tsx` no existe. La solución definitiva es la basada en `Intl.DateTimeFormat` descrita arriba.