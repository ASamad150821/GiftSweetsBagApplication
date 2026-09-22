import type { CustomerDetails } from "../store/orderStore";

export function FormField({id, label, value, error, type="text", onChange, onBlur} : {id: keyof CustomerDetails, label: string, value: string, error?: string, type?: string, onChange: (value: string) => void, onBlur?: () => void }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-plum">{label}</label>
            <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"></input>
            {error && ( 
            <p id={`${id}-error`} className="mt-1 text-xs text-berry-dark">{error}</p>
            )}
        </div>
    )
}
