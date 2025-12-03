'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

interface HeaderProps {
  userEmail?: string
}

export function Header({ userEmail }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <User size={20} className="text-gray-600 dark:text-gray-300" />
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {userEmail && (
              <div className="border-b px-4 py-3 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                <p className="truncate text-sm font-medium dark:text-white">{userEmail}</p>
              </div>
            )}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Settings size={16} />
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
