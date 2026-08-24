import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { getSupabase } from "../lib/supabaseClient"

export function LoginPage() {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error } = await getSupabase().auth.signInWithPassword({ email, password });

        setIsSubmitting(false);

        if (error) {
            setError('Incorrect email or password.');
            return;
        }

        navigate('/orders');
    }

    return (
        <main className="mx-auto max-w-md px-6 py-12">
            <h1 className="text-3xl font-semibold text-plum">Sign in</h1>
            <p className="mt-2 text-plum/60">Sign in to view orders placed through the site.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-plum" htmlFor="email">Email</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
                </div>

                <div>
                    <label className="block text-sm font-medium text-plum" htmlFor="password">Password</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
                </div>

                {error && <p className="text-sm text-berry" role="alert">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="mt-2 w-full rounded-xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-berry/80 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </main>
    )
}
