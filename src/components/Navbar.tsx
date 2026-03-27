'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() { 
  const { data: session, status } = useSession();

  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-blue-400">
          FuelZen
        </Link>
        <div className="flex gap-4 items-center">
          {status === 'loading' ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : session ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-300 transition">Dashboard</Link>
              <Link href="/receipts" className="hover:text-blue-300 transition">Receipts</Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-300 transition">Login</Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}