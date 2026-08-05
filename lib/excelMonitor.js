import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

// Encabezados de la plantilla de import/export. Deben coincidir en ambos sentidos:
// exportar produce estas columnas, importar las espera con estos mismos nombres.
export const COLUMNAS_PLANTILLA = [
  'Material SAP',
  'Código Edan',
  'Producto',
  'Proveedor',
  'Stock ya',
  'De salida',
  'Precio FOB (USD)',
  'Peso (kg)',
  'Volumen (m3)',
];

// ------------------------------------------------------------
// EXPORTAR: genera un .xlsx a partir de la vista monitor_stock actual
// ------------------------------------------------------------
export function exportarMonitorAExcel(productos) {
  const filas = productos.map((p) => ({
    'Material SAP': p.material_sap || '',
    'Código Edan': p.codigo_edan || '',
    'Producto': p.descripcion,
    'Proveedor': p.proveedor_nombre || '',
    'Stock ya': p.stock_ya ?? 0,
    'De salida': p.de_salida ?? 0,
    'Precio FOB (USD)': p.precio_fob ?? '',
    'Peso (kg)': p.peso_kg ?? '',
    'Volumen (m3)': p.volumen_m3 ?? '',
  }));

  const hoja = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_PLANTILLA });
  hoja['!cols'] = [
    { wch: 20 }, { wch: 16 }, { wch: 42 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Monitor de stock');

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `monitor-stock-deam_${fecha}.xlsx`);
}

// ------------------------------------------------------------
// PLANTILLA: genera un .xlsx vacío (solo encabezados + una fila de ejemplo)
// para que el usuario sepa qué formato espera el import.
// ------------------------------------------------------------
export function descargarPlantillaImport() {
  const filaEjemplo = {
    'Material SAP': '100000000000950404',
    'Código Edan': '',
    'Producto': 'Bomba Jeringa Leex S7',
    'Proveedor': 'Edan',
    'Stock ya': 10,
    'De salida': 0,
    'Precio FOB (USD)': 333,
    'Peso (kg)': 3,
    'Volumen (m3)': 0.011,
  };

  const hoja = XLSX.utils.json_to_sheet([filaEjemplo], { header: COLUMNAS_PLANTILLA });
  hoja['!cols'] = [
    { wch: 20 }, { wch: 16 }, { wch: 42 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla');
  XLSX.writeFile(libro, 'plantilla-import-monitor-stock.xlsx');
}

// ------------------------------------------------------------
// IMPORTAR: lee un archivo .xlsx (File del input) y devuelve las filas parseadas
// Solo actualiza Stock ya / De salida y da de alta productos nuevos (Material SAP
// no encontrado). No pisa Proveedor/FOB/peso/volumen de productos existentes salvo
// que la fila los traiga completos.
// ------------------------------------------------------------
export function leerExcelImport(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const libro = XLSX.read(e.target.result, { type: 'array' });
        const primeraHoja = libro.Sheets[libro.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(primeraHoja, { defval: null });

        const parsed = filas
          .map((f) => ({
            material_sap: String(f['Material SAP'] || '').trim(),
            codigo_edan: f['Código Edan'] ? String(f['Código Edan']).trim() : null,
            descripcion: f['Producto'] ? String(f['Producto']).trim() : null,
            proveedor_nombre: f['Proveedor'] ? String(f['Proveedor']).trim() : null,
            stock_ya: f['Stock ya'] !== null && f['Stock ya'] !== undefined ? Number(f['Stock ya']) : 0,
            de_salida: f['De salida'] !== null && f['De salida'] !== undefined ? Number(f['De salida']) : 0,
            precio_fob: f['Precio FOB (USD)'] !== null && f['Precio FOB (USD)'] !== undefined && f['Precio FOB (USD)'] !== ''
              ? Number(f['Precio FOB (USD)']) : null,
            peso_kg: f['Peso (kg)'] !== null && f['Peso (kg)'] !== undefined && f['Peso (kg)'] !== '' ? Number(f['Peso (kg)']) : null,
            volumen_m3: f['Volumen (m3)'] !== null && f['Volumen (m3)'] !== undefined && f['Volumen (m3)'] !== '' ? Number(f['Volumen (m3)']) : null,
          }))
          .filter((f) => f.material_sap);

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ------------------------------------------------------------
// APLICAR IMPORT: recibe las filas parseadas y hace upsert en Supabase.
// - Si el proveedor no existe, lo crea.
// - Si el producto (por material_sap) no existe, lo crea con los datos de la fila.
// - Si el producto existe, actualiza solo stock_fisico (Stock ya / De salida).
// Devuelve un resumen: { productosNuevos, productosActualizados, errores }
// ------------------------------------------------------------
export async function aplicarImportMonitor(filas) {
  const resumen = { productosNuevos: 0, productosActualizados: 0, errores: [] };

  // 1. Resolver proveedores mencionados en el archivo que no existan todavía
  const nombresProveedor = [...new Set(filas.map((f) => f.proveedor_nombre).filter(Boolean))];
  const proveedorIdPorNombre = {};

  if (nombresProveedor.length > 0) {
    const { data: existentes } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .in('nombre', nombresProveedor);

    for (const p of existentes || []) proveedorIdPorNombre[p.nombre] = p.id;

    const faltantes = nombresProveedor.filter((n) => !proveedorIdPorNombre[n]);
    if (faltantes.length > 0) {
      const { data: creados, error } = await supabase
        .from('proveedores')
        .insert(faltantes.map((nombre) => ({ nombre })))
        .select('id, nombre');
      if (error) resumen.errores.push(`Proveedores: ${error.message}`);
      for (const p of creados || []) proveedorIdPorNombre[p.nombre] = p.id;
    }
  }

  // 2. Productos existentes por material_sap
  const materiales = filas.map((f) => f.material_sap);
  const { data: existentes } = await supabase
    .from('productos')
    .select('id, material_sap')
    .in('material_sap', materiales);

  const idPorMaterial = {};
  for (const p of existentes || []) idPorMaterial[p.material_sap] = p.id;

  for (const fila of filas) {
    const proveedor_id = fila.proveedor_nombre ? proveedorIdPorNombre[fila.proveedor_nombre] : null;
    let productoId = idPorMaterial[fila.material_sap];

    if (!productoId) {
      // Alta de producto nuevo
      const { data, error } = await supabase
        .from('productos')
        .insert({
          material_sap: fila.material_sap,
          codigo_edan: fila.codigo_edan,
          descripcion: fila.descripcion || fila.material_sap,
          proveedor_id,
          precio_fob: fila.precio_fob,
          peso_kg: fila.peso_kg,
          volumen_m3: fila.volumen_m3,
        })
        .select('id')
        .single();

      if (error) {
        resumen.errores.push(`${fila.material_sap}: ${error.message}`);
        continue;
      }
      productoId = data.id;
      resumen.productosNuevos += 1;
    } else {
      resumen.productosActualizados += 1;
    }

    const { error: errStock } = await supabase
      .from('stock_fisico')
      .upsert(
        { producto_id: productoId, stock_ya: fila.stock_ya, de_salida: fila.de_salida, actualizado_at: new Date().toISOString() },
        { onConflict: 'producto_id' }
      );
    if (errStock) resumen.errores.push(`${fila.material_sap} (stock): ${errStock.message}`);
  }

  return resumen;
}
