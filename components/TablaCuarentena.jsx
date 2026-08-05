'use client';

import { formatNumero, formatFecha } from '@/lib/format';
import BadgeEstado from './BadgeEstado';

const ORIGEN_LABEL = {
  llegada_importacion: 'Llegada de importación',
  retorno_demo: 'Retorno de demo',
  otro: 'Otro',
};

export default function TablaCuarentena({ registros, onVerDetalle }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th className="num">Cantidad</th>
            <th>Origen</th>
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
              <td style={{ color: 'var(--text-secondary)' }}>{ORIGEN_LABEL[r.origen] || r.origen}</td>
              <td><BadgeEstado estado={r.estado} /></td>
              <td style={{ color: 'var(--text-secondary)' }}>{formatFecha(r.fecha_ingreso)}</td>
            </tr>
          ))}
          {registros.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                No hay registros en Cuarentena.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
