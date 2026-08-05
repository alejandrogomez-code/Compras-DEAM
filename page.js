'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatUSD } from '@/lib/format';

export default function ConfiguracionPage() {
  const [tab, setTab] = useState('proveedores');
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const [{ data: prov }, { data: prod }] = await Promise.all([
        supabase.from('proveedores').select('*').order('nombre'),
        supabase.from('productos').select('id, material_sap, codigo_edan, descripcion, precio_fob, proveedores(nombre)').order('descripcion').limit(200),
      ]);
      setProveedores(prov || []);
      setProductos(prod || []);
      setCargando(false);
    }
    cargar();
  }, []);

  return (
    <div>
      <p className="page-title">Configuración</p>
      <p className="page-subtitle">Proveedores, productos y precios FOB.</p>

      <div className="tabs">
        <button className={`tab ${tab === 'proveedores' ? 'active' : ''}`} onClick={() => setTab('proveedores')}>
          Proveedores
        </button>
        <button className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>
          Productos y precios FOB
        </button>
      </div>

      {cargando && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}

      {!cargando && tab === 'proveedores' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Formato de export</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.formato_export || 'Genérico'}</td>
                  <td>
                    <span className={`badge ${p.activo ? 'badge-verde' : 'badge-neutro'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && tab === 'productos' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Material SAP</th>
                <th>Cód. Edan</th>
                <th>Proveedor</th>
                <th className="num">Precio FOB</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.descripcion}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.material_sap}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.codigo_edan || '—'}</td>
                  <td>{p.proveedores?.nombre || '—'}</td>
                  <td className="num-tabular">{formatUSD(p.precio_fob)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 12px 0' }}>
            Mostrando los primeros 200 productos. El buscador y la edición inline se agregan en la próxima vuelta.
          </p>
        </div>
      )}
    </div>
  );
}
