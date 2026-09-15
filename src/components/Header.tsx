import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/order', label: 'Order', end: false },
]

const authedNavItems = [{ to: '/orders', label: 'My Orders', end: false }]

export function Header() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-plum/10 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-berry">
          <span aria-hidden="true">🍬</span>
          Sweet Bags
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label="Primary" className="flex gap-1 rounded-full bg-white/70 p-1">
            {[...navItems, ...(user ? authedNavItems : [])].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-berry text-white' : 'text-plum/70 hover:bg-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-plum/70 hover:bg-white"
            >
              Log out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-plum/70 hover:bg-white"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
