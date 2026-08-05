'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatNumero, formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

const CONFIG = {
  demo: {
    tabla: 'demos',
    titulo: 'Demo',
    vacio: 'No hay información de este producto en Demo.',
    detalleLinea: (r) => r.cliente,
    campoFecha: 'fecha_salida',
    labelFecha: 'Salida',
  },
  no_conforme: {
    tabla: 'no_conforme',
    titulo: 'No conforme',
    vacio: 'No hay información de este producto en No conforme.',
    detalleLinea: (r) => r.motivo,
    campoFecha: 'fecha_ingreso',
    labelFecha: 'Ingreso',
  },
  cuarentena: {
    tabla: 'cuarentena',
    titulo: 'Cuarentena',
    vacio: 'No hay información de este producto en Cuarentena.',
    detalleLinea: (r) => (r.origen === 'llegada_importacion' ? 'Llegada de importación' : r.origen === 'retorno_demo' ? 'Retorno de demo' : 'Otro'),
    campoFecha: 'fecha_ingreso',
    labelFecha: 'Ingreso',
  },
};

// Modal "de solo consulta" que se abre desde Vista general al hacer clic en
// la cantidad de NC o Cuarentena de un producto: lista los registros de ESE
// producto en la tabla correspondiente. Para editar un registro puntual, se
// hace desde la pestaña propia (No conforme / Cuarentena), que abre
// ModalDetalleNoConforme / ModalDetalleCuarentena.
export default function ModalDetallePorProducto({ producto, tipo, onClose }) {
  const config = CONFIG[tipo];
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data, error } = await supabase
        .from(config.tabla)
        .select('*')
        .eq('producto_id', producto.producto_id)
        .order(config.campoFecha, { ascending: false });
      if (!error) setRegistros(data || []);
      setCargando(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto.producto_id, tipo]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{config.titulo}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {producto.descripcion}
            </p>
          </div>
          <button className="btn" onClick={onClose} style={{ border: 'none', padding: 4, height: 'auto' }} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {cargando && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</p>}

          {!cargando && registros.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '16px 0' }}>
              {config.vacio}
            </p>
          )}

          {!cargando &&
            registros.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{config.detalleLinea(r)}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {config.labelFecha} {formatFecha(r[config.campoFecha])}
                  </p>
                  {r.observaciones && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{r.observaciones}</p>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <BadgeEstado estado={r.estado} />
                  </div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{formatNumero(r.cantidad)} un</p>
              </div>
            ))}
        </div>

        {(tipo === 'no_conforme' || tipo === 'cuarentena') && (
          <div className="modal-footer">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Para editar un registro, andá a la pestaña &quot;{config.titulo}&quot; y hacé clic en la fila correspondiente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
