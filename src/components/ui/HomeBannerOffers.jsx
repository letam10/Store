import HomeBannerArtwork from './HomeBannerArtwork'
import { homeBannerOffers } from './homeBannerOfferData'
import './HomeBannerOffers.css'
import './HomeBannerOfferThemes.css'
import './HomeBannerProduct.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function HomeBannerOffers({ side, overview, account, products, count, offset, compact = false }) {
  const offers = homeBannerOffers(side, overview, account, products).slice(offset, offset + count)

  return offers.map(offer => (
    <a
      className={'home-side-banner home-banner-offer home-banner-offer--' + offer.kind + (compact ? ' home-side-banner--compact' : '')}
      key={offer.id}
      href={offer.href}
      data-banner-id={offer.id}
      aria-label={offer.title + '. ' + offer.action}
    >
      <div className="home-banner-offer__visual">
        <p className="home-banner-offer__label">{offer.label}</p>
        {offer.product?.image ? <>
          <div className="home-banner-offer__product-art">
            <img
              src={offer.product.image}
              alt={offer.product.name}
              width="240"
              height="220"
              loading="lazy"
            />
          </div>
          <div className="home-banner-offer__product-caption">
            <span>GỢI Ý TRONG DANH MỤC</span>
            <strong>{offer.product.name}</strong>
            <b>{money.format(offer.product.price)}</b>
          </div>
        </> : <HomeBannerArtwork kind={offer.artwork || offer.kind} />}
      </div>
      <h3>{offer.title}</h3>
      <p className="home-banner-offer__note">{offer.note}</p>
      <ul className="home-side-banner__details">
        {offer.details?.map(detail => <li key={detail}>{detail}</li>)}
      </ul>
      <span className="home-banner-offer__action">
        {offer.action}
        <span aria-hidden="true">↗</span>
      </span>
    </a>
  ))
}
