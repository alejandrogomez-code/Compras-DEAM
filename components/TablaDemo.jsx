'use client';

import { formatNumero, formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

export default function TablaDemo({ registros, onVerDetalle }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cliente</th>
            <th className="num">Cantidad</th>
            <th>Estado</th>
            <th>Fecha de salida</th>
            <th>Retorno estimado</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => onVerDetalle(r)}>
              <td>{r.productos?.descripcion}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{r.cliente}</td>
              <td className="num-tabular">{formatNumero(r.cantidad)}</td>
              <td><BadgeEstado estado={r.estado} /></td>
              <td style={{ color: 'var(--text-secondary)' }}>{formatFecha(r.fecha_salida)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{formatFecha(r.fecha_retorno_estimada)}</td>
            </tr>
          ))}
          {registros.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                No hay registros de Demo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
