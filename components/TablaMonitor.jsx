'use client';

import { formatNumero, claseColorNumero } from '@/lib/format';

// Columnas visibles según la pestaña activa dentro de Monitor de stock.
// "reservado", "demo", "no_conforme" y "cuarentena" abren el detalle al hacer click.

export default function TablaMonitor({ productos, onVerDetalle }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="num">Stock</th>
            <th className="num">Reservado</th>
            <th className="num">Demo</th>
            <th className="num">NC</th>
            <th className="num">Cuarentena</th>
            <th className="num">Disponible</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.producto_id}>
              <td>{p.descripcion}</td>
              <td className="num-tabular">{formatNumero(p.stock_ya)}</td>
              <td className="num-tabular">
                {p.reservado > 0 ? (
                  <button className="link-cell" onClick={() => onVerDetalle(p, 'reservado')}>
                    {formatNumero(p.reservado)}
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                )}
              </td>
              <td className="num-tabular">
                {p.en_demo > 0 ? (
                  <button className="link-cell" onClick={() => onVerDetalle(p, 'demo')}>
                    {formatNumero(p.en_demo)}
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                )}
              </td>
              <td className="num-tabular">
                {p.no_conforme > 0 ? (
                  <button className="link-cell" onClick={() => onVerDetalle(p, 'no_conforme')}>
                    {formatNumero(p.no_conforme)}
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                )}
              </td>
              <td className="num-tabular">
                {p.en_cuarentena > 0 ? (
                  <button className="link-cell" onClick={() => onVerDetalle(p, 'cuarentena')}>
                    {formatNumero(p.en_cuarentena)}
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                )}
              </td>
              <td className={`num-tabular ${claseColorNumero(p.disponible)}`}>
                {formatNumero(p.disponible)}
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                No hay productos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
