import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/order', label: 'Order', end: false },
  { to: '/orders', label: 'View Orders - Super User Access Only', end: false },
]

export function Header() {
    return (
        <header className="border-b border-plum/10 bg-cream/80 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-berry">
                    <span aria-hidden="true">🍬</span>
                    Sweet Bags
                </Link>
                <nav aria-label="primary" className="flex gap-1 rounded-full bg-white/70 p-1">
                    {navItems.map((item) => (
                        <NavLink to={item.to} key={item.to} end={item.end}
                         className={({isActive}) => 
                         `rounded-full px-4 py-1.5 text-sm font-medium transition ${isActive ? 'bg-berry text-white' : 'text-plum/70 hover:bg-white'}`} >{item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    )
}