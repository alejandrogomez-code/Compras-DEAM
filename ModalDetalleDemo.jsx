'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

const ESTADOS = ['en_demo', 'devuelto', 'vendido'];

export default function ModalDetalleDemo({ registro, onClose, onGuardado }) {
  const [estado, setEstado] = useState(registro.estado);
  const [cliente, setCliente] = useState(registro.cliente || '');
  const [fechaRetornoEstimada, setFechaRetornoEstimada] = useState(registro.fecha_retorno_estimada || '');
  const [observaciones, setObservaciones] = useState(registro.observaciones || '');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    const { error } = await supabase
      .from('demos')
      .update({
        estado,
        cliente,
        fecha_retorno_estimada: fechaRetornoEstimada || null,
        observaciones: observaciones || null,
      })
      .eq('id', registro.id);
    setGuardando(false);
    if (!error) {
      onGuardado?.();
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Demo</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {registro.productos?.descripcion}
            </p>
          </div>
          <button className="btn" onClick={onClose} style={{ border: 'none', padding: 4, height: 'auto' }} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cantidad</span>
            <span style={{ fontWeight: 600 }}>{registro.cantidad} un</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Fecha de salida</span>
            <span>{formatFecha(registro.fecha_salida)}</span>
          </div>

          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Cliente</label>
          <input className="input" value={cliente} onChange={(e) => setCliente(e.target.value)} />

          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Estado</label>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <div><BadgeEstado estado={estado} /></div>

          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Retorno estimado</label>
          <input
            className="input"
            type="date"
            value={fechaRetornoEstimada || ''}
            onChange={(e) => setFechaRetornoEstimada(e.target.value)}
          />

          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Observaciones</label>
          <textarea
            className="input"
            style={{ height: 60, paddingTop: 8, resize: 'vertical' }}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
