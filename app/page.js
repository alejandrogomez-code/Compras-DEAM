'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatNumero, claseColorNumero } from '@/lib/format';
import { exportarMonitorAExcel, descargarPlantillaImport, leerExcelImport, aplicarImportMonitor } from '@/lib/excelMonitor';
import {
  exportarNoConformeAExcel, descargarPlantillaNoConforme, leerImportNoConforme, aplicarImportNoConforme,
  exportarCuarentenaAExcel, descargarPlantillaCuarentena, leerImportCuarentena, aplicarImportCuarentena,
} from '@/lib/excelNoConformeCuarentena';
import TablaMonitor from '@/components/TablaMonitor';
import TablaNoConforme from '@/components/TablaNoConforme';
import TablaCuarentena from '@/components/TablaCuarentena';
import ModalDetalleReservas from '@/components/ModalDetalleReservas';
import ModalDetalleNoConforme from '@/components/ModalDetalleNoConforme';
import ModalDetalleCuarentena from '@/components/ModalDetalleCuarentena';
import ModalResultadoImport from '@/components/ModalResultadoImport';

const PESTANAS = [
  { key: 'general', label: 'Vista general' },
  { key: 'reservado', label: 'Reservado' },
  { key: 'demo', label: 'Demo' },
  { key: 'no_conforme', label: 'No conforme' },
  { key: 'cuarentena', label: 'Cuarentena' },
];

export default function MonitorStockPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [productos, setProductos] = useState([]);
  const [registrosNC, setRegistrosNC] = useState([]);
  const [registrosCuarentena, setRegistrosCuarentena] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState('general');
  const [busqueda, setBusqueda] = useState('');
  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [modalProducto, setModalProducto] = useState(null);
  const [modalNC, setModalNC] = useState(null);
  const [modalCuarentena, setModalCuarentena] = useState(null);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [importando, setImportando] = useState(false);
  const [resumenImport, setResumenImport] = useState(null);
  const [lineasResumenImport, setLineasResumenImport] = useState(null);

  async function cargarMonitor() {
    setCargando(true);
    const [{ data: monitor, error }, { data: nc }, { data: cu }] = await Promise.all([
      supabase.from('monitor_stock').select('*').order('descripcion', { ascending: true }),
      supabase.from('no_conforme').select('*, productos(descripcion, material_sap, categoria)').order('fecha_ingreso', { ascending: false }),
      supabase.from('cuarentena').select('*, productos(descripcion, material_sap, categoria)').order('fecha_ingreso', { ascending: false }),
    ]);
    if (!error) setProductos(monitor || []);
    setRegistrosNC(nc || []);
    setRegistrosCuarentena(cu || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarMonitor();
  }, []);

  const proveedores = useMemo(() => {
    const set = new Set(productos.map((p) => p.proveedor_nombre).filter(Boolean));
    return [...set].sort();
  }, [productos]);

  const contadores = useMemo(() => {
    return {
      reservado: productos.filter((p) => p.reservado > 0).length,
      demo: productos.filter((p) => p.en_demo > 0).length,
      no_conforme: registrosNC.filter((r) => r.estado === 'pendiente' || r.estado === 'en_revision').length,
      cuarentena: registrosCuarentena.filter((r) => r.estado === 'pendiente').length,
    };
  }, [productos, registrosNC, registrosCuarentena]);

  const productosFiltrados = useMemo(() => {
    let lista = productos;
    if (pestana === 'reservado') lista = lista.filter((p) => p.reservado > 0);
    if (pestana === 'demo') lista = lista.filter((p) => p.en_demo > 0);
    if (proveedorFiltro) lista = lista.filter((p) => p.proveedor_nombre === proveedorFiltro);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((p) => p.descripcion?.toLowerCase().includes(q));
    }
    return lista;
  }, [productos, pestana, busqueda, proveedorFiltro]);

  const noConformeFiltrado = useMemo(() => {
    let lista = registrosNC;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((r) => r.productos?.descripcion?.toLowerCase().includes(q));
    }
    return lista;
  }, [registrosNC, busqueda]);

  const cuarentenaFiltrada = useMemo(() => {
    let lista = registrosCuarentena;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((r) => r.productos?.descripcion?.toLowerCase().includes(q));
    }
    return lista;
  }, [registrosCuarentena, busqueda]);

  const resumen = useMemo(() => {
    const negativos = productos.filter((p) => p.disponible < 0).length;
    const totalDisponible = productos.reduce((acc, p) => acc + (p.disponible || 0), 0);
    return { negativos, totalDisponible, total: productos.length };
  }, [productos]);

  function abrirDetalle(producto) {
    setModalProducto(producto);
  }

  function toggleSeleccion(productoId) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(productoId)) next.delete(productoId);
      else next.add(productoId);
      return next;
    });
  }

  function toggleTodos(marcar) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const p of productosFiltrados) {
        if (marcar) next.add(p.producto_id);
        else next.delete(p.producto_id);
      }
      return next;
    });
  }

  function irAlSimuladorConSeleccion() {
    const ids = [...seleccionados];
    sessionStorage.setItem('simulador_productos_preseleccionados', JSON.stringify(ids));
    router.push('/simulador?desde_monitor=1');
  }

  function handleExportar() {
    if (pestana === 'no_conforme') return exportarNoConformeAExcel(noConformeFiltrado);
    if (pestana === 'cuarentena') return exportarCuarentenaAExcel(cuarentenaFiltrada);
    return exportarMonitorAExcel(productosFiltrados);
  }

  function handlePlantilla() {
    if (pestana === 'no_conforme') return descargarPlantillaNoConforme();
    if (pestana === 'cuarentena') return descargarPlantillaCuarentena();
    return descargarPlantillaImport();
  }

  async function handleImportar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    try {
      if (pestana === 'no_conforme') {
        const filas = await leerImportNoConforme(file);
        const r = await aplicarImportNoConforme(filas);
        setResumenImport(r);
        setLineasResumenImport([
          { label: 'registros de No Conforme creados', valor: r.registrosCreados, color: 'verde' },
          { label: 'productos nuevos dados de alta (repuesto/accesorio)', valor: r.productosNuevos, color: 'neutro' },
        ]);
      } else if (pestana === 'cuarentena') {
        const filas = await leerImportCuarentena(file);
        const r = await aplicarImportCuarentena(filas);
        setResumenImport(r);
        setLineasResumenImport([
          { label: 'registros de Cuarentena creados', valor: r.registrosCreados, color: 'verde' },
          { label: 'productos nuevos dados de alta (repuesto/accesorio)', valor: r.productosNuevos, color: 'neutro' },
        ]);
      } else {
        const filas = await leerExcelImport(file);
        const r = await aplicarImportMonitor(filas);
        setResumenImport(r);
        setLineasResumenImport(null);
      }
      await cargarMonitor();
    } catch (err) {
      setResumenImport({ errores: [err.message || 'Error al leer el archivo'] });
      setLineasResumenImport([]);
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const esPestanaConTablaPropia = pestana === 'no_conforme' || pestana === 'cuarentena';

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {!esPestanaConTablaPropia && (
            <select
              className="input"
              value={proveedorFiltro}
              onChange={(e) => setProveedorFiltro(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          <input
            className="input"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: 200 }}
          />
          <button className="btn" onClick={handleExportar}>Exportar Excel</button>
          <button className="btn" onClick={handlePlantilla}>Plantilla</button>
          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={importando}>
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleImportar}
          />
        </div>
      </div>

      {cargando ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      ) : pestana === 'no_conforme' ? (
        <TablaNoConforme registros={noConformeFiltrado} onVerDetalle={(r) => setModalNC(r)} />
      ) : pestana === 'cuarentena' ? (
        <TablaCuarentena registros={cuarentenaFiltrada} onVerDetalle={(r) => setModalCuarentena(r)} />
      ) : (
        <TablaMonitor
          productos={productosFiltrados}
          seleccionados={seleccionados}
          onToggleSeleccion={toggleSeleccion}
          onToggleTodos={toggleTodos}
          onVerDetalle={(p) => abrirDetalle(p)}
        />
      )}

      {!esPestanaConTablaPropia && seleccionados.size > 0 && (
        <div className="barra-seleccion">
          <div className="barra-seleccion-inner">
            <span>{seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
            <button className="btn btn-ghost" onClick={() => setSeleccionados(new Set())}>Cancelar</button>
            <button className="btn" onClick={irAlSimuladorConSeleccion}>Agregar al simulador ({seleccionados.size})</button>
          </div>
        </div>
      )}

      {modalProducto && (
        <ModalDetalleReservas
          producto={modalProducto}
          onClose={() => setModalProducto(null)}
          onCambio={cargarMonitor}
        />
      )}

      {modalNC && (
        <ModalDetalleNoConforme
          registro={modalNC}
          onClose={() => setModalNC(null)}
          onGuardado={cargarMonitor}
        />
      )}

      {modalCuarentena && (
        <ModalDetalleCuarentena
          registro={modalCuarentena}
          onClose={() => setModalCuarentena(null)}
          onGuardado={cargarMonitor}
        />
      )}

      {resumenImport && (
        <ModalResultadoImport
          resumen={resumenImport}
          lineas={lineasResumenImport}
          onClose={() => { setResumenImport(null); setLineasResumenImport(null); }}
        />
      )}
    </div>
  );
}
