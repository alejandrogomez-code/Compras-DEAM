import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

// ============================================================
// NO CONFORME
// ============================================================

export const COLUMNAS_NC = [
  'Material SAP', 'Producto', 'Cantidad', 'Motivo', 'Estado', 'Fecha ingreso', 'Resolución', 'Observaciones',
];

export function exportarNoConformeAExcel(registros) {
  const filas = registros.map((r) => ({
    'Material SAP': r.productos?.material_sap || '',
    'Producto': r.productos?.descripcion || '',
    'Cantidad': r.cantidad,
    'Motivo': r.motivo || '',
    'Estado': r.estado,
    'Fecha ingreso': r.fecha_ingreso || '',
    'Resolución': r.resolucion || '',
    'Observaciones': r.observaciones || '',
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_NC });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'No conforme');
  XLSX.writeFile(libro, `no-conforme_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function descargarPlantillaNoConforme() {
  const ejemplo = {
    'Material SAP': '100000000000150198', 'Producto': 'Membrana Teclado p/ SE1', 'Cantidad': 6,
    'Motivo': 'Bloqueado (SAP)', 'Estado': 'pendiente', 'Fecha ingreso': '2026-08-05',
    'Resolución': '', 'Observaciones': '',
  };
  const hoja = XLSX.utils.json_to_sheet([ejemplo], { header: COLUMNAS_NC });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla');
  XLSX.writeFile(libro, 'plantilla-import-no-conforme.xlsx');
}

// ============================================================
// CUARENTENA
// ============================================================

export const COLUMNAS_CUARENTENA = [
  'Material SAP', 'Producto', 'Cantidad', 'Origen', 'Estado', 'Fecha ingreso', 'Resultado verificación', 'Observaciones',
];

export function exportarCuarentenaAExcel(registros) {
  const filas = registros.map((r) => ({
    'Material SAP': r.productos?.material_sap || '',
    'Producto': r.productos?.descripcion || '',
    'Cantidad': r.cantidad,
    'Origen': r.origen,
    'Estado': r.estado,
    'Fecha ingreso': r.fecha_ingreso || '',
    'Resultado verificación': r.resultado_verificacion || '',
    'Observaciones': r.observaciones || '',
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_CUARENTENA });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Cuarentena');
  XLSX.writeFile(libro, `cuarentena_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function descargarPlantillaCuarentena() {
  const ejemplo = {
    'Material SAP': '100000000000150193', 'Producto': 'Placa Madre p/ SE3B', 'Cantidad': 1,
    'Origen': 'llegada_importacion', 'Estado': 'pendiente', 'Fecha ingreso': '2026-08-05',
    'Resultado verificación': '', 'Observaciones': '',
  };
  const hoja = XLSX.utils.json_to_sheet([ejemplo], { header: COLUMNAS_CUARENTENA });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla');
  XLSX.writeFile(libro, 'plantilla-import-cuarentena.xlsx');
}

// ============================================================
// LECTURA GENÉRICA (comparte parser, distinta forma de mapear filas)
// ============================================================

function leerHoja(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const libro = XLSX.read(e.target.result, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(hoja, { defval: null }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ------------------------------------------------------------
// IMPORTAR NO CONFORME: por Material SAP. Si el material no existe como
// producto, lo crea como repuesto_accesorio (igual que en la importación
// original desde QC & NC). Cada fila del Excel se inserta como un
// registro nuevo en no_conforme (no actualiza registros existentes,
// porque el motivo de un ingreso nuevo puede repetirse legítimamente).
// ------------------------------------------------------------
export async function leerImportNoConforme(file) {
  const filas = await leerHoja(file);
  return filas
    .map((f) => ({
      material_sap: String(f['Material SAP'] || '').trim(),
      descripcion: f['Producto'] ? String(f['Producto']).trim() : null,
      cantidad: Number(f['Cantidad']) || 0,
      motivo: f['Motivo'] ? String(f['Motivo']).trim() : 'Bloqueado (SAP)',
      estado: f['Estado'] ? String(f['Estado']).trim() : 'pendiente',
      fecha_ingreso: f['Fecha ingreso'] || null,
      resolucion: f['Resolución'] || null,
      observaciones: f['Observaciones'] || null,
    }))
    .filter((f) => f.material_sap && f.cantidad > 0);
}

export async function aplicarImportNoConforme(filas) {
  const resumen = { registrosCreados: 0, productosNuevos: 0, errores: [] };

  const materiales = filas.map((f) => f.material_sap);
  const { data: existentes } = await supabase.from('productos').select('id, material_sap').in('material_sap', materiales);
  const idPorMaterial = {};
  for (const p of existentes || []) idPorMaterial[p.material_sap] = p.id;

  for (const fila of filas) {
    let productoId = idPorMaterial[fila.material_sap];
    if (!productoId) {
      const { data, error } = await supabase
        .from('productos')
        .insert({ material_sap: fila.material_sap, descripcion: fila.descripcion || fila.material_sap, categoria: 'repuesto_accesorio' })
        .select('id')
        .single();
      if (error) { resumen.errores.push(`${fila.material_sap}: ${error.message}`); continue; }
      productoId = data.id;
      idPorMaterial[fila.material_sap] = productoId;
      resumen.productosNuevos += 1;
    }

    const { error } = await supabase.from('no_conforme').insert({
      producto_id: productoId,
      cantidad: fila.cantidad,
      motivo: fila.motivo,
      estado: fila.estado,
      fecha_ingreso: fila.fecha_ingreso || undefined,
      resolucion: fila.resolucion,
      observaciones: fila.observaciones,
    });
    if (error) resumen.errores.push(`${fila.material_sap}: ${error.message}`);
    else resumen.registrosCreados += 1;
  }

  return resumen;
}

// ------------------------------------------------------------
// IMPORTAR CUARENTENA: mismo criterio que No Conforme
// ------------------------------------------------------------
export async function leerImportCuarentena(file) {
  const filas = await leerHoja(file);
  return filas
    .map((f) => ({
      material_sap: String(f['Material SAP'] || '').trim(),
      descripcion: f['Producto'] ? String(f['Producto']).trim() : null,
      cantidad: Number(f['Cantidad']) || 0,
      origen: f['Origen'] ? String(f['Origen']).trim() : 'llegada_importacion',
      estado: f['Estado'] ? String(f['Estado']).trim() : 'pendiente',
      fecha_ingreso: f['Fecha ingreso'] || null,
      resultado_verificacion: f['Resultado verificación'] || null,
      observaciones: f['Observaciones'] || null,
    }))
    .filter((f) => f.material_sap && f.cantidad > 0);
}

export async function aplicarImportCuarentena(filas) {
  const resumen = { registrosCreados: 0, productosNuevos: 0, errores: [] };

  const materiales = filas.map((f) => f.material_sap);
  const { data: existentes } = await supabase.from('productos').select('id, material_sap').in('material_sap', materiales);
  const idPorMaterial = {};
  for (const p of existentes || []) idPorMaterial[p.material_sap] = p.id;

  for (const fila of filas) {
    let productoId = idPorMaterial[fila.material_sap];
    if (!productoId) {
      const { data, error } = await supabase
        .from('productos')
        .insert({ material_sap: fila.material_sap, descripcion: fila.descripcion || fila.material_sap, categoria: 'repuesto_accesorio' })
        .select('id')
        .single();
      if (error) { resumen.errores.push(`${fila.material_sap}: ${error.message}`); continue; }
      productoId = data.id;
      idPorMaterial[fila.material_sap] = productoId;
      resumen.productosNuevos += 1;
    }

    const { error } = await supabase.from('cuarentena').insert({
      producto_id: productoId,
      cantidad: fila.cantidad,
      origen: fila.origen,
      estado: fila.estado,
      fecha_ingreso: fila.fecha_ingreso || undefined,
      resultado_verificacion: fila.resultado_verificacion,
      observaciones: fila.observaciones,
    });
    if (error) resumen.errores.push(`${fila.material_sap}: ${error.message}`);
    else resumen.registrosCreados += 1;
  }

  return resumen;
}
