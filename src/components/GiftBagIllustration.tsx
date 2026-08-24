import holloway1 from '../assets/holloway1.jpg'

export function GiftBagIllustration({ className } : { className?: string }) {
    return (
        <div className={className}>
            <img src={holloway1} alt="Gift Bag Illustration"/>
        </div>
    )
}