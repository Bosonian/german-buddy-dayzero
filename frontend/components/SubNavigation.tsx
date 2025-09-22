import { usePathname } from 'next/navigation'

export default function SubNavigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '🏠 Practice' },
    { href: '/reading', label: '📖 Stories' },
    { href: '/dictionary', label: '📚 Dictionary' },
    { href: '/vocabulary-review', label: '🧠 Vocabulary Review' },
  ]

  return (
    <nav className="flex items-center space-x-6 text-sm mb-8">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={`${pathname === link.href ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors`}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
