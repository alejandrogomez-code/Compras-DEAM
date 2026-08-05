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

## Qué incluye esta primera versión

- **Monitor de stock**: vista general con Stock, Reservado, Demo, No Conforme, Cuarentena y Disponible calculado. Pestañas para filtrar por cada subsección, con contador de productos afectados. Los negativos en "Disponible" se resaltan en rojo automáticamente.
- **Detalle de reservas**: clic en la cantidad de "Reservado" abre un panel con el listado de reservas activas (cliente, cantidad, fechas) y permite cargar una reserva nueva o cancelar una existente.
- **Simulador de compras**: selector de proveedor, tabla de sus productos con stock actual y campo editable de cantidad a pedir, con subtotal en USD FOB y m³ en tiempo real.
- **Configuración**: listado de proveedores y de productos con sus precios FOB.

## Qué falta para la próxima vuelta

- Detalle clicable para Demo, No Conforme y Cuarentena (hoy solo Reservado tiene el modal; la estructura de datos ya está lista para los otros tres).
- Alta/edición de productos y proveedores desde Configuración (hoy es solo lectura).
- Exportar el borrador del Simulador a Excel.
- Formatos de pedido específicos por proveedor (Saikang, Enmind, Orantech) — hoy el simulador es genérico.
- Sincronización de stock físico (hoy `stock_fisico` se carga una vez desde el Excel; falta definir cómo se actualiza a futuro: manual, import periódico, o integración con SAP).
