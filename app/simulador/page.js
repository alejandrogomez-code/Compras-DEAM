'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatNumero, formatUSD } from '@/lib/format';

export default function SimuladorPage() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarProveedores() {
      const { data } = await supabase.from('proveedores').select('*').order('nombre');
      setProveedores(data || []);
      if (data && data.length > 0) setProveedorId(data[0].id);
    }
    cargarProveedores();
  }, []);

  useEffect(() => {
    if (!proveedorId) return;
    async function cargarProductos() {
      setCargando(true);
      const { data } = await supabase
        .from('productos')
        .select('id, material_sap, codigo_edan, descripcion, precio_fob, volumen_m3, stock_fisico(stock_ya)')
        .eq('proveedor_id', proveedorId)
        .order('descripcion');
      setProductos(data || []);
      setCantidades({});
      setCargando(false);
    }
    cargarProductos();
  }, [proveedorId]);

  const items = productos.filter((p) => Number(cantidades[p.id]) > 0);
  const subtotalUSD = items.reduce((acc, p) => acc + Number(cantidades[p.id] || 0) * (p.precio_fob || 0), 0);
  const subtotalM3 = items.reduce((acc, p) => acc + Number(cantidades[p.id] || 0) * (p.volumen_m3 || 0), 0);

  return (
    <div>
      <p className="page-title">Simulador de compras</p>
      <p className="page-subtitle">Armá un borrador de pedido por proveedor y mirá el subtotal en USD FOB y m³.</p>

      <div style={{ marginBottom: 16 }}>
        <select className="input" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={{ width: 220 }}>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="metric-cards">
        <div className="metric-card">
          <p className="metric-card-label">Items en borrador</p>
          <p className="metric-card-value">{formatNumero(items.length)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-card-label">Subtotal USD FOB</p>
          <p className="metric-card-value">{formatUSD(subtotalUSD)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-card-label">Volumen estimado</p>
          <p className="metric-card-value">{formatNumero(subtotalM3, 2)} m³</p>
        </div>
      </div>

      {cargando ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando productos...</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cód. Edan</th>
                <th className="num">Stock</th>
                <th className="num">Pedir</th>
                <th className="num">FOB u.</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const stock = p.stock_fisico?.[0]?.stock_ya ?? p.stock_fisico?.stock_ya ?? 0;
                const cantidad = cantidades[p.id] || '';
                const subtotal = Number(cantidad || 0) * (p.precio_fob || 0);
                return (
                  <tr key={p.id}>
                    <td>{p.descripcion}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.codigo_edan || '—'}</td>
                    <td className="num-tabular">{formatNumero(stock)}</td>
                    <td className="num-tabular">
                      <input
                        type="number"
                        min="0"
                        className="input"
                        style={{ width: 70, height: 28, textAlign: 'right' }}
                        value={cantidad}
                        onChange={(e) =>
                          setCantidades({ ...cantidades, [p.id]: e.target.value })
                        }
                      />
                    </td>
                    <td className="num-tabular">{formatUSD(p.precio_fob)}</td>
                    <td className="num-tabular" style={{ fontWeight: subtotal > 0 ? 600 : 400 }}>
                      {formatUSD(subtotal)}
                    </td>
                  </tr>
                );
              })}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                    Este proveedor todavía no tiene productos cargados en Configuración.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
