import { Link } from 'react-router-dom'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <header
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Тендерний робочий стіл
          </h1>
        </Link>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 40px' }}>
        {children}
      </main>
    </div>
  )
}
