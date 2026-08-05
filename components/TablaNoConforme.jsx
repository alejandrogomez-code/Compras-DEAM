'use client';

import { formatNumero, formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

export default function TablaNoConforme({ registros, onVerDetalle }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th className="num">Cantidad</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Fecha ingreso</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => onVerDetalle(r)}>
              <td>{r.productos?.descripcion}</td>
              <td>
                {r.productos?.categoria === 'repuesto_accesorio' ? (
                  <span className="badge badge-neutro">Repuesto/accesorio</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Equipo</span>
                )}
              </td>
              <td className="num-tabular">{formatNumero(r.cantidad)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{r.motivo}</td>
              <td><BadgeEstado estado={r.estado} /></td>
              <td style={{ color: 'var(--text-secondary)' }}>{formatFecha(r.fecha_ingreso)}</td>
            </tr>
          ))}
          {registros.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                No hay registros de No Conforme.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
