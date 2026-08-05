'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatNumero, formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

export default function ModalDetalleReservas({ producto, onClose, onCambio }) {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ cliente: '', cantidad: '', fecha_vencimiento: '', observaciones: '' });
  const [guardando, setGuardando] = useState(false);

  async function cargarReservas() {
    setCargando(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('producto_id', producto.producto_id)
      .in('estado', ['activa', 'confirmada'])
      .order('fecha_reserva', { ascending: false });
    if (!error) setReservas(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto.producto_id]);

  async function guardarReserva(e) {
    e.preventDefault();
    if (!form.cliente || !form.cantidad) return;
    setGuardando(true);
    const { error } = await supabase.from('reservas').insert({
      producto_id: producto.producto_id,
      cliente: form.cliente,
      cantidad: Number(form.cantidad),
      fecha_vencimiento: form.fecha_vencimiento || null,
      observaciones: form.observaciones || null,
    });
    setGuardando(false);
    if (!error) {
      setForm({ cliente: '', cantidad: '', fecha_vencimiento: '', observaciones: '' });
      setMostrarForm(false);
      await cargarReservas();
      onCambio?.();
    }
  }

  async function cancelarReserva(id) {
    const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);
    if (!error) {
      await cargarReservas();
      onCambio?.();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Reservas activas</p>
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

          {!cargando && reservas.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '16px 0' }}>
              No hay reservas activas para este producto.
            </p>
          )}

          {!cargando &&
            reservas.map((r) => (
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
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{r.cliente}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Reservado {formatFecha(r.fecha_reserva)}
                    {r.fecha_vencimiento ? ` · Vence ${formatFecha(r.fecha_vencimiento)}` : ''}
                  </p>
                  {r.observaciones && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{r.observaciones}</p>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <BadgeEstado estado={r.estado} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{formatNumero(r.cantidad)} un</p>
                  <button
                    className="link-cell"
                    style={{ fontSize: 12 }}
                    onClick={() => cancelarReserva(r.id)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}

          {mostrarForm && (
            <form onSubmit={guardarReserva} style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="input"
                placeholder="Nombre del cliente"
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                required
              />
              <input
                className="input"
                type="number"
                min="1"
                placeholder="Cantidad"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                required
              />
              <input
                className="input"
                type="date"
                value={form.fecha_vencimiento}
                onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              />
              <input
                className="input"
                placeholder="Observaciones (opcional)"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={guardando} style={{ flex: 1, justifyContent: 'center' }}>
                  {guardando ? 'Guardando...' : 'Guardar reserva'}
                </button>
                <button type="button" className="btn" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {!mostrarForm && (
          <div className="modal-footer">
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMostrarForm(true)}>
              + Nueva reserva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
