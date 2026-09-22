export function Feature({title, body} : {title: string, body: string}) {
    return (
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <h2 className="text-base font-semibold text-plum">{title}</h2>
            <p className="mt-1 text-sm text-plum/60">{body}</p>
        </div>
    )
} 