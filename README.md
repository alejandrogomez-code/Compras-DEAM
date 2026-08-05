# Monitor de Stock — DEAM

App para centralizar los informes de compras y logística de DEAM, reemplazando el Excel "Monitor de Stock".

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres + Auth + Storage)
- Vercel (deploy)

## 1. Supabase

1. Creá un proyecto nuevo en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** → **New query**.
3. Pegá y ejecutá, en este orden:
   - `sql/001_schema.sql` — crea todas las tablas, la vista `monitor_stock` y los proveedores base.
   - `sql/002_import_productos.sql` — importa los 243 productos del Excel (con precio FOB, peso, volumen y stock actual al 04/08/2026).
   - `sql/003_import_embarques.sql` — importa los 18 embarques activos y sus items.
   - `sql/004_mejoras_monitor.sql` — agrega la columna "En camino" a la vista y la función que confirma un pedido del Simulador generando su embarque automáticamente.
   - `sql/005_import_nc_cuarentena.sql` — importa No Conforme (columna "Bloqueado" ≠ 0 de la hoja QC & NC) y Cuarentena (columna "Inspecc. de calidad" ≠ 0). Agrega la columna `categoria` a productos y da de alta como `repuesto_accesorio` los materiales que no eran parte de los 243 equipos originales.
   - `sql/006_fix_rls_nc_cuarentena.sql` — corre esto si las pestañas "No conforme" o "Cuarentena" te aparecen vacías aunque la Vista general sí muestre números en esas columnas: revisa y corrige Row Level Security en `no_conforme`, `cuarentena` y `productos`.
4. Andá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public key`

## 2. Variables de entorno

Copiá `.env.local.example` a `.env.local` (para desarrollo local) o cargalas directo en Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. GitHub

Subí todo este contenido a un repo nuevo (vía la interfaz web de GitHub: "Add file" → "Upload files").

## 4. Vercel

1. Importá el repo desde Vercel.
2. Framework preset: **Next.js** (se detecta solo).
3. Cargá las dos variables de entorno del paso 2 en **Settings → Environment Variables**.
4. Deploy.

## Qué incluye esta versión

- **Monitor de stock (Vista general)**: Stock ya, Proveedor, Reservado, Demo, NC, Cuarentena, En camino, No disponible y Disponible. Filtro por proveedor, buscador de texto, checkboxes con barra flotante "Agregar al simulador (N)". Los negativos en "Disponible" se resaltan en rojo, y "Disponible"/"No disponible" tienen fondo de color propio.
- **No Conforme y Cuarentena**: ahora son listados propios con todos los registros reales (137 y 50, importados desde la hoja QC & NC del Excel: "Bloqueado" ≠ 0 para No Conforme, "Inspecc. de calidad" ≠ 0 para Cuarentena). Cada fila se puede abrir para editar estado, motivo/resolución u origen/resultado de verificación. Los productos que no existían como equipo (repuestos y accesorios) se dieron de alta marcados con la categoría "Repuesto/accesorio", y sus cantidades impactan igual en "No disponible" y "Disponible" del Monitor general.
- **Detalle de reservas**: clic en la cantidad de "Reservado" (en Vista general) abre un panel con el listado de reservas activas.
- **Detalle de Demo/No conforme/Cuarentena desde Vista general**: clic en la cantidad de esas columnas abre un modal de consulta con los registros de ese producto puntual, con el mensaje correcto para cada sección (antes por error abría siempre el texto de "reservas").
- **Simulador de compras**: selector de proveedor o productos preseleccionados desde el Monitor. Al confirmar un borrador se genera automáticamente un embarque, que alimenta la columna "En camino".
- **Exportar / importar Excel por sección**: tanto en Vista general como en No Conforme y Cuarentena hay botones "Exportar Excel", "Plantilla" e "Importar Excel", cada uno con el formato correspondiente a esa sección. Importar en No Conforme/Cuarentena crea registros nuevos (no actualiza los existentes) y da de alta productos nuevos como repuesto/accesorio si hace falta.
- **Configuración**: listado de proveedores y de productos con sus precios FOB.

## Qué falta para la próxima vuelta

- Alta/edición de productos y proveedores desde Configuración (hoy es solo lectura).
- Formatos de pedido específicos por proveedor (Saikang, Enmind, Orantech) al exportar desde el Simulador — hoy el simulador es genérico.
- Marcar un embarque como "Recibido" desde la UI (hoy solo se puede vía SQL) para que salga de "En camino" y pase a sumar Stock ya.
- Alta manual de un registro nuevo de No Conforme o Cuarentena desde la propia pantalla (hoy se cargan solo por import o directamente en Supabase).
