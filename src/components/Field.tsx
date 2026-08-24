import type { CustomerDetails } from "../store/orderStore";

export function Field({id, type, label, value, onChange, error, onBlur}: {id: keyof CustomerDetails, type: string, label: string, value: string, onChange: (value: string) => void, error?: string, onBlur?: () => void}) {
    return (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-plum">{label}</label>
        <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
        {error && <p className="mt-2 text-sm text-berry">{error}</p>}
    </div>
    )
}