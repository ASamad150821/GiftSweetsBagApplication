import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export function RegisterPage() {
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register)

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event : ChangeEvent) {
      event.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
        await register({name: name, email: email, password: password});
        navigate('/order');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something Went Wrong, Please Try Again')
      } finally {
        setSubmitting(false)
      }
    }

    return (
        <main className="mx-auto max-w-md px-6 py-16">
            <h1 className="text-3xl font-semibold text-plum">Create an account</h1>
            <p className="mt-2 text-plum/60">You'll need an account to place an order.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-plum">Full Name</label>
                <input id="name" value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-plum">Email</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-plum">Password</label>
                <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
              </div>

              {error && (
                <p role="alert" className="text-sm text-berry-dark">
                {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="w-full rounded-full bg-berry px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-berry-dark disabled:opacity-60">
                {submitting ? 'Creating account…' : 'Create account'}
              </button>

            </form>
            
            <p className="mt-6 text-sm text-plum/60">Already have an account?{' '}
            <Link to="/login" className="font-medium text-berry hover:underline">Log in</Link>
            </p>
            
        </main>
    )
}
