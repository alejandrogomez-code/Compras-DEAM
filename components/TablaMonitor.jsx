'use client';

import { formatNumero, claseColorNumero } from '@/lib/format';

export default function TablaMonitor({ productos, seleccionados, onToggleSeleccion, onToggleTodos, onVerDetalle }) {
  const todosSeleccionados = productos.length > 0 && productos.every((p) => seleccionados.has(p.producto_id));

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={(e) => onToggleTodos(e.target.checked)}
                aria-label="Seleccionar todos"
              />
            </th>
            <th>Producto</th>
            <th>Proveedor</th>
            <th className="num">Stock ya</th>
            <th className="num">Reservado</th>
            <th className="num">Demo</th>
            <th className="num">NC</th>
            <th className="num">Cuarentena</th>
            <th className="num">En camino</th>
            <th className="num col-no-disponible-header">No disponible</th>
            <th className="num col-disponible-header">Disponible</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.producto_id}>
              <td className="col-check">
                <input
                  type="checkbox"
                  checked={seleccionados.has(p.producto_id)}
                  onChange={() => onToggleSeleccion(p.producto_id)}
                  aria-label={`Seleccionar ${p.descripcion}`}
                />
              </td>
              <td>{p.descripcion}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{p.proveedor_nombre || '—'}</td>
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
              <td className="num-tabular">
                {p.en_camino > 0 ? formatNumero(p.en_camino) : <span style={{ color: 'var(--text-muted)' }}>0</span>}
              </td>
              <td className="num-tabular col-no-disponible">{formatNumero(p.no_disponible)}</td>
              <td className={`num-tabular col-disponible ${claseColorNumero(p.disponible)}`}>
                {formatNumero(p.disponible)}
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                No hay productos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
