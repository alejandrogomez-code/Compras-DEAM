import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Monitor de Stock — DEAM',
  description: 'Centralización de compras y logística DEAM',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
