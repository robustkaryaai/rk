'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AiOutlineHome, AiOutlineDatabase, AiOutlineSetting, AiOutlineUser, AiOutlineControl } from 'react-icons/ai';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', href: '/home', icon: AiOutlineHome },
        { name: 'Data', href: '/data', icon: AiOutlineDatabase },
        { name: 'Control', href: '/control', icon: AiOutlineControl }, // New Control Item
        { name: 'Settings', href: '/settings', icon: AiOutlineSetting },
        { name: 'Profile', href: '/profile', icon: AiOutlineUser },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="nav-icon" />
                        <span className="nav-label">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
