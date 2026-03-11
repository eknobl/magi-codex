import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="navbar">
      <Link href="/dashboard" className="navbar-brand">
        MAGI CODEX
      </Link>
      <Link href="/dashboard" className="navbar-link">
        DASHBOARD
      </Link>
    </nav>
  );
}
