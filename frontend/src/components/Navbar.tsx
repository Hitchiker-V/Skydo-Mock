"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    // Don't show navbar on login, register, or public payment pages
    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/pay');
    if (isPublicPage) return null;

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Clients', href: '/clients' },
        { name: 'Invoices', href: '/invoices' },
        { name: 'Settings', href: '/settings/profile' },
    ];

    return (
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center mr-8">
                            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                                Skydo Mock
                            </Link>
                        </div>
                        <div className="hidden sm:flex sm:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname.startsWith(link.href)
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                router.push('/login');
                            }}
                            className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
