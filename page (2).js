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
  const [nombrePedido, setNombrePedido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [idsPreseleccionados, setIdsPreseleccionados] = useState(null);

  // Al llegar desde "Agregar al simulador" del Monitor, leemos los productos
  // marcados (pueden ser de proveedores distintos) y los mostramos todos juntos,
  // ignorando el filtro por proveedor único hasta que el usuario lo cambie.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('desde_monitor') === '1') {
      const raw = sessionStorage.getItem('simulador_productos_preseleccionados');
      if (raw) {
        try {
          setIdsPreseleccionados(JSON.parse(raw));
        } catch {
          setIdsPreseleccionados(null);
        }
        sessionStorage.removeItem('simulador_productos_preseleccionados');
      }
    }
  }, []);

  useEffect(() => {
    async function cargarProveedores() {
      const { data } = await supabase.from('proveedores').select('*').order('nombre');
      setProveedores(data || []);
      if (!idsPreseleccionados && data && data.length > 0) setProveedorId(data[0].id);
    }
    cargarProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function cargarPreseleccionados() {
      setCargando(true);
      const { data } = await supabase
        .from('productos')
        .select('id, material_sap, codigo_edan, descripcion, precio_fob, volumen_m3, proveedor_id, proveedores(nombre), stock_fisico(stock_ya)')
        .in('id', idsPreseleccionados)
        .order('descripcion');
      setProductos(data || []);
      setCantidades({});
      setCargando(false);
    }

    async function cargarPorProveedor() {
      if (!proveedorId) return;
      setCargando(true);
      const { data } = await supabase
        .from('productos')
        .select('id, material_sap, codigo_edan, descripcion, precio_fob, volumen_m3, proveedor_id, proveedores(nombre), stock_fisico(stock_ya)')
        .eq('proveedor_id', proveedorId)
        .order('descripcion');
      setProductos(data || []);
      setCantidades({});
      setCargando(false);
    }

    if (idsPreseleccionados && idsPreseleccionados.length > 0) {
      cargarPreseleccionados();
    } else {
      cargarPorProveedor();
    }
  }, [proveedorId, idsPreseleccionados]);

  const items = productos.filter((p) => Number(cantidades[p.id]) > 0);
  const subtotalUSD = items.reduce((acc, p) => acc + Number(cantidades[p.id] || 0) * (p.precio_fob || 0), 0);
  const subtotalM3 = items.reduce((acc, p) => acc + Number(cantidades[p.id] || 0) * (p.volumen_m3 || 0), 0);

  function limpiarPreseleccion() {
    setIdsPreseleccionados(null);
    if (proveedores.length > 0) setProveedorId(proveedores[0].id);
  }

  async function guardarBorrador() {
    if (items.length === 0) return;
    setGuardando(true);
    setMensaje(null);

    const proveedorParaGuardar = idsPreseleccionados ? items[0]?.proveedor_id : proveedorId;

    const { data: pedido, error } = await supabase
      .from('pedidos_simulados')
      .insert({
        nombre: nombrePedido || `Borrador ${new Date().toLocaleDateString('es-AR')}`,
        proveedor_id: proveedorParaGuardar || null,
        estado: 'borrador',
      })
      .select('id')
      .single();

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
      setGuardando(false);
      return;
    }

    const filasItems = items.map((p) => ({
      pedido_id: pedido.id,
      producto_id: p.id,
      cantidad: Number(cantidades[p.id]),
      precio_fob_unitario: p.precio_fob,
    }));

    const { error: errItems } = await supabase.from('pedido_simulado_items').insert(filasItems);
    setGuardando(false);

    if (errItems) {
      setMensaje({ tipo: 'error', texto: errItems.message });
      return;
    }

    setMensaje({ tipo: 'ok', texto: 'Borrador guardado. Podés confirmarlo cuando esté listo.', pedidoId: pedido.id });
  }

  async function confirmarPedido(pedidoId) {
    setConfirmando(true);
    const { error } = await supabase.rpc('confirmar_pedido_simulado', { p_pedido_id: pedidoId });
    setConfirmando(false);
    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
      return;
    }
    setMensaje({ tipo: 'ok', texto: 'Pedido confirmado: se generó el embarque y ya aparece en "En camino" del Monitor.' });
    setCantidades({});
  }

  return (
    <div>
      <p className="page-title">Simulador de compras</p>
      <p className="page-subtitle">Armá un borrador de pedido por proveedor y mirá el subtotal en USD FOB y m³.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {idsPreseleccionados ? (
          <>
            <span className="badge badge-neutro">
              {productos.length} producto{productos.length !== 1 ? 's' : ''} traídos desde el Monitor
            </span>
            <button className="btn" onClick={limpiarPreseleccion}>Quitar selección y elegir proveedor</button>
          </>
        ) : (
          <select className="input" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={{ width: 220 }}>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}
        <input
          className="input"
          placeholder="Nombre del pedido (opcional)"
          value={nombrePedido}
          onChange={(e) => setNombrePedido(e.target.value)}
          style={{ width: 220 }}
        />
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

      {mensaje && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 13,
            background: mensaje.tipo === 'error' ? 'var(--rojo-bg)' : 'var(--verde-bg)',
            color: mensaje.tipo === 'error' ? 'var(--rojo)' : 'var(--verde)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{mensaje.texto}</span>
          {mensaje.pedidoId && (
            <button className="btn btn-primary" disabled={confirmando} onClick={() => confirmarPedido(mensaje.pedidoId)}>
              {confirmando ? 'Confirmando...' : 'Confirmar pedido'}
            </button>
          )}
        </div>
      )}

      {cargando ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando productos...</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                {idsPreseleccionados && <th>Proveedor</th>}
                <th>Cód. Edan</th>
                <th className="num">Stock ya</th>
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
                    {idsPreseleccionados && (
                      <td style={{ color: 'var(--text-secondary)' }}>{p.proveedores?.nombre || '—'}</td>
                    )}
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
                  <td colSpan={idsPreseleccionados ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                    Este proveedor todavía no tiene productos cargados en Configuración.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" disabled={guardando} onClick={guardarBorrador}>
            {guardando ? 'Guardando...' : 'Guardar borrador'}
          </button>
        </div>
      )}
    </div>
  );
}
