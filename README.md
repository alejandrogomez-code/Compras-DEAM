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

- **Monitor de stock**: vista general con Stock ya, Proveedor, Reservado, Demo, NC, Cuarentena, En camino, No disponible y Disponible. Pestañas para filtrar por cada subsección, con contador de productos afectados. Filtro adicional por proveedor y buscador de texto. Los negativos en "Disponible" se resaltan en rojo, y "Disponible" / "No disponible" tienen fondo de color propio (verde/rojo y ámbar respectivamente) para que salten a la vista entre tantos números.
- **Selección múltiple**: checkbox por fila (y "seleccionar todos" en el encabezado) con una barra flotante "Agregar al simulador (N)" que manda los productos elegidos directo al Simulador de compras, sin importar de qué proveedor sean.
- **Detalle de reservas**: clic en la cantidad de "Reservado" abre un panel con el listado de reservas activas (cliente, cantidad, fechas) y permite cargar una reserva nueva o cancelar una existente.
- **Simulador de compras**: selector de proveedor (filtra sus productos por defecto) o, si venís desde el Monitor con productos seleccionados, los muestra a todos juntos con su columna de Proveedor visible. Guarda el borrador y, al confirmarlo, genera automáticamente un embarque nuevo — eso es lo que alimenta la columna "En camino" del Monitor.
- **Exportar / importar Excel**: "Exportar Excel" baja la vista actual del Monitor (respeta los filtros aplicados). "Plantilla" baja un .xlsx vacío con los encabezados esperados y una fila de ejemplo. "Importar Excel" lee un archivo con ese formato: actualiza Stock ya / De salida de productos existentes (por Material SAP) y da de alta los que no existan, creando el proveedor si hace falta.
- **Configuración**: listado de proveedores y de productos con sus precios FOB.

## Qué falta para la próxima vuelta

- Detalle clicable para Demo, No Conforme y Cuarentena (hoy solo Reservado tiene el modal; la estructura de datos ya está lista para los otros tres). Falta además incorporar el listado real de No Conforme que se va a compartir.
- Alta/edición de productos y proveedores desde Configuración (hoy es solo lectura).
- Formatos de pedido específicos por proveedor (Saikang, Enmind, Orantech) al exportar desde el Simulador — hoy el simulador es genérico.
- Marcar un embarque como "Recibido" desde la UI (hoy solo se puede vía SQL) para que salga de "En camino" y pase a sumar Stock ya.
