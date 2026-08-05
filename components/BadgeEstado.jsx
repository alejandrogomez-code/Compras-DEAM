const ESTADO_CONFIG = {
  arribado_cordoba: { label: 'Arribado a Córdoba', color: 'verde' },
  arribado_chile: { label: 'Arribado a Chile', color: 'ambar' },
  en_transito: { label: 'En tránsito', color: 'ambar' },
  en_coordinacion: { label: 'En coordinación', color: 'neutro' },
  en_produccion: { label: 'En producción', color: 'neutro' },
  por_nacionalizar: { label: 'Por nacionalizar', color: 'ambar' },
  recibido: { label: 'Recibido', color: 'verde' },
  activa: { label: 'Activa', color: 'verde' },
  confirmada: { label: 'Confirmada', color: 'verde' },
  vencida: { label: 'Vencida', color: 'rojo' },
  cancelada: { label: 'Cancelada', color: 'neutro' },
  en_demo: { label: 'En demo', color: 'ambar' },
  devuelto: { label: 'Devuelto', color: 'verde' },
  vendido: { label: 'Vendido', color: 'verde' },
  pendiente: { label: 'Pendiente', color: 'ambar' },
  en_revision: { label: 'En revisión', color: 'ambar' },
  resuelto: { label: 'Resuelto', color: 'verde' },
  descartado: { label: 'Descartado', color: 'neutro' },
  aprobado: { label: 'Aprobado', color: 'verde' },
  rechazado: { label: 'Rechazado', color: 'rojo' },
};

export default function BadgeEstado({ estado }) {
  const config = ESTADO_CONFIG[estado] || { label: estado, color: 'neutro' };
  return <span className={`badge badge-${config.color}`}>{config.label}</span>;
}
