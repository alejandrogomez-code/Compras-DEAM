'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const secciones = [
  {
    grupo: 'Monitor de stock',
    items: [{ href: '/', label: 'Monitor de stock', icon: '📋' }],
  },
  {
    grupo: 'Compras',
    items: [{ href: '/simulador', label: 'Simulador de compras', icon: '🧮' }],
  },
  {
    grupo: 'Sistema',
    items: [{ href: '/configuracion', label: 'Configuración', icon: '⚙️' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        padding: '20px 0',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>DEAM</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          Monitor de stock
        </p>
      </div>

      {secciones.map((s) => (
        <div key={s.grupo} style={{ marginBottom: 18 }}>
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              padding: '0 20px',
              margin: '0 0 6px',
            }}
          >
            {s.grupo}
          </p>
          {s.items.map((item) => {
            const activo = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  marginRight: 8,
                  fontSize: 13,
                  fontWeight: activo ? 600 : 400,
                  color: activo ? 'var(--accent)' : 'var(--text-secondary)',
                  background: activo ? 'var(--accent-bg)' : 'transparent',
                  borderRadius: activo ? '0 8px 8px 0' : 0,
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
