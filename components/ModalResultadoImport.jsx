'use client';

// Modal genérico de resultado de import. `lineas` es un array de
// { label, valor, color } para mostrar como badges, y `errores` la lista
// de mensajes de error (si los hubo).
export default function ModalResultadoImport({ resumen, lineas, onClose }) {
  if (!resumen) return null;

  const filasResumen = lineas || [
    { label: 'productos nuevos dados de alta', valor: resumen.productosNuevos, color: 'verde' },
    { label: 'productos existentes actualizados (stock ya / de salida)', valor: resumen.productosActualizados, color: 'neutro' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ width: 380, height: 'auto', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Importación completada</p>
          <button className="btn" onClick={onClose} style={{ border: 'none', padding: 4, height: 'auto' }} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ paddingBottom: 16 }}>
          {filasResumen.map((f, i) => (
            <p key={i} style={{ fontSize: 13, margin: '12px 0' }}>
              <span className={`badge badge-${f.color}`}>{f.valor}</span> {f.label}
            </p>
          ))}
          {resumen.errores?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--rojo)', fontWeight: 600, margin: '0 0 6px' }}>
                {resumen.errores.length} fila(s) con error:
              </p>
              <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0 }}>
                {resumen.errores.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
