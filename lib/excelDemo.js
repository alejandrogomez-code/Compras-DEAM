import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

export const COLUMNAS_DEMO = [
  'Material SAP', 'Producto', 'Cliente', 'Cantidad', 'Estado', 'Fecha salida', 'Retorno estimado', 'Observaciones',
];

export function exportarDemoAExcel(registros) {
  const filas = registros.map((r) => ({
    'Material SAP': r.productos?.material_sap || '',
    'Producto': r.productos?.descripcion || '',
    'Cliente': r.cliente || '',
    'Cantidad': r.cantidad,
    'Estado': r.estado,
    'Fecha salida': r.fecha_salida || '',
    'Retorno estimado': r.fecha_retorno_estimada || '',
    'Observaciones': r.observaciones || '',
  }));
  const hoja = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_DEMO });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Demo');
  XLSX.writeFile(libro, `demo_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function descargarPlantillaDemo() {
  const ejemplo = {
    'Material SAP': '100000000000150193', 'Producto': 'Placa Madre p/ SE3B', 'Cliente': 'Cardio Serel S R L',
    'Cantidad': 1, 'Estado': 'en_demo', 'Fecha salida': '2026-08-05', 'Retorno estimado': '', 'Observaciones': '',
  };
  const hoja = XLSX.utils.json_to_sheet([ejemplo], { header: COLUMNAS_DEMO });
  hoja['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 30 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla');
  XLSX.writeFile(libro, 'plantilla-import-demo.xlsx');
}

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
// IMPORTAR DEMO: por Material SAP. Si el material no existe como
// producto, lo crea como repuesto_accesorio. Cada fila del Excel
// se inserta como un registro nuevo en demos (un mismo producto puede
// estar en demo en varios clientes a la vez, así que no se actualiza
// un registro existente, se agrega uno nuevo).
// ------------------------------------------------------------
export async function leerImportDemo(file) {
  const filas = await leerHoja(file);
  return filas
    .map((f) => ({
      material_sap: String(f['Material SAP'] || '').trim(),
      descripcion: f['Producto'] ? String(f['Producto']).trim() : null,
      cliente: f['Cliente'] ? String(f['Cliente']).trim() : null,
      cantidad: Number(f['Cantidad']) || 0,
      estado: f['Estado'] ? String(f['Estado']).trim() : 'en_demo',
      fecha_salida: f['Fecha salida'] || null,
      fecha_retorno_estimada: f['Retorno estimado'] || null,
      observaciones: f['Observaciones'] || null,
    }))
    .filter((f) => f.material_sap && f.cliente && f.cantidad > 0);
}

export async function aplicarImportDemo(filas) {
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

    const { error } = await supabase.from('demos').insert({
      producto_id: productoId,
      cliente: fila.cliente,
      cantidad: fila.cantidad,
      estado: fila.estado,
      fecha_salida: fila.fecha_salida || undefined,
      fecha_retorno_estimada: fila.fecha_retorno_estimada,
      observaciones: fila.observaciones,
    });
    if (error) resumen.errores.push(`${fila.material_sap}: ${error.message}`);
    else resumen.registrosCreados += 1;
  }

  return resumen;
}
