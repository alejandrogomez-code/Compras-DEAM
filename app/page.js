'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatNumero, claseColorNumero } from '@/lib/format';
import TablaMonitor from '@/components/TablaMonitor';
import ModalDetalleReservas from '@/components/ModalDetalleReservas';

const PESTANAS = [
  { key: 'general', label: 'Vista general' },
  { key: 'reservado', label: 'Reservado' },
  { key: 'demo', label: 'Demo' },
  { key: 'no_conforme', label: 'No conforme' },
  { key: 'cuarentena', label: 'Cuarentena' },
];

export default function MonitorStockPage() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState('general');
  const [busqueda, setBusqueda] = useState('');
  const [modalProducto, setModalProducto] = useState(null);

  async function cargarMonitor() {
    setCargando(true);
    const { data, error } = await supabase
      .from('monitor_stock')
      .select('*')
      .order('descripcion', { ascending: true });
    if (!error) setProductos(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarMonitor();
  }, []);

  const contadores = useMemo(() => {
    return {
      reservado: productos.filter((p) => p.reservado > 0).length,
      demo: productos.filter((p) => p.en_demo > 0).length,
      no_conforme: productos.filter((p) => p.no_conforme > 0).length,
      cuarentena: productos.filter((p) => p.en_cuarentena > 0).length,
    };
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let lista = productos;
    if (pestana === 'reservado') lista = lista.filter((p) => p.reservado > 0);
    if (pestana === 'demo') lista = lista.filter((p) => p.en_demo > 0);
    if (pestana === 'no_conforme') lista = lista.filter((p) => p.no_conforme > 0);
    if (pestana === 'cuarentena') lista = lista.filter((p) => p.en_cuarentena > 0);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((p) => p.descripcion?.toLowerCase().includes(q));
    }
    return lista;
  }, [productos, pestana, busqueda]);

  const resumen = useMemo(() => {
    const negativos = productos.filter((p) => p.disponible < 0).length;
    const totalDisponible = productos.reduce((acc, p) => acc + (p.disponible || 0), 0);
    return { negativos, totalDisponible, total: productos.length };
  }, [productos]);

  function abrirDetalle(producto) {
    setModalProducto(producto);
  }

  return (
    <div>
      <p className="page-title">Monitor de stock</p>
      <p className="page-subtitle">Stock físico, reservas, demos, no conforme y cuarentena en un solo lugar.</p>

      <div className="metric-cards">
        <div className="metric-card">
          <p className="metric-card-label">Productos activos</p>
          <p className="metric-card-value">{formatNumero(resumen.total)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-card-label">Con disponible negativo</p>
          <p className={`metric-card-value ${resumen.negativos > 0 ? 'num-negativo' : ''}`}>
            {formatNumero(resumen.negativos)}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-card-label">Disponible total (unidades)</p>
          <p className={`metric-card-value ${claseColorNumero(resumen.totalDisponible)}`}>
            {formatNumero(resumen.totalDisponible)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs">
          {PESTANAS.map((t) => (
            <button
              key={t.key}
              className={`tab ${pestana === t.key ? 'active' : ''}`}
              onClick={() => setPestana(t.key)}
            >
              {t.label}
              {contadores[t.key] !== undefined && (
                <span className="tab-count">{contadores[t.key]}</span>
              )}
            </button>
          ))}
        </div>
        <input
          className="input"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: 220, marginBottom: 12 }}
        />
      </div>

      {cargando ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      ) : (
        <TablaMonitor productos={productosFiltrados} onVerDetalle={(p) => abrirDetalle(p)} />
      )}

      {modalProducto && (
        <ModalDetalleReservas
          producto={modalProducto}
          onClose={() => setModalProducto(null)}
          onCambio={cargarMonitor}
        />
      )}
    </div>
  );
}
