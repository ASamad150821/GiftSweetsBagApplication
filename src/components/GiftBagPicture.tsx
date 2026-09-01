import giftBagPicture from '../assets/GiftBagPicture.jpg'

export function GiftBagPicture({ className } : { className?: string }) {
    return (
        <div className={className}>
            <img src={giftBagPicture} alt="Gift Bag Picture"/>
        </div>
    )
}