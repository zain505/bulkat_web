import { ArrowLeft, CreditCard, PackageCheck, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import CartLine from '../components/CartLine'
import SummaryPanel from '../components/SummaryPanel'
import { useI18n } from '../useI18n'
import { formatMoney } from '../utils/commerce'

function CartView({ cart, products, summary, onQuantityChange, onCheckout }) {
  const { locale, t } = useI18n()
  const cartLines = summary.items.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }))
  const itemCount = cartLines.reduce((total, item) => total + item.quantity, 0)
  const savingsTotal = summary.totals.discountTotal

  if (cartLines.length === 0) {
    return (
      <section className="cartScreen">
        <div className="cartEmptyPanel">
          <div className="cartEmptyIcon">
            <ShoppingCart size={30} />
          </div>
          <span className="eyebrow">{t('cart.eyebrow')}</span>
          <h1>{t('cart.emptyTitle')}</h1>
          <p>{t('cart.emptyText')}</p>
          <Link className="primaryButton" to="/">
            <ShoppingBag size={18} />
            <span>{t('cart.continueShopping')}</span>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="cartScreen">
      <header className="cartHeader">
        <div className="cartHeaderCopy">
          <span className="eyebrow">{t('cart.eyebrow')}</span>
          <div className="sectionTitle">
            <ShoppingCart size={22} />
            <h1>{t('cart.title')}</h1>
          </div>
          <p>{t('cart.subtitle')}</p>
        </div>
        <div className="cartHeaderStats" aria-label={t('cart.cartOverview')}>
          <div>
            <span>{t('cart.itemCount', { count: itemCount })}</span>
            <strong>{formatMoney(summary.totals.grandTotal, locale)}</strong>
            <small>{t('summary.total')}</small>
          </div>
          <div>
            <span>{t('cart.uniqueCount', { count: cartLines.length })}</span>
            <strong>{formatMoney(Math.max(0, savingsTotal), locale)}</strong>
            <small>{t('summary.discount')}</small>
          </div>
        </div>
      </header>

      <div className="cartProgress" aria-label={t('cart.checkoutProgress')}>
        <span className="active">
          <PackageCheck size={18} />
          {t('cart.reviewStep')}
        </span>
        <span>
          <Truck size={18} />
          {t('cart.deliveryStep')}
        </span>
        <span>
          <CreditCard size={18} />
          {t('cart.paymentStep')}
        </span>
      </div>

      <div className="cartContent">
        <div className="cartItemsPanel">
          <div className="cartListHeader">
            <div>
              <h2>{t('cart.reviewItems')}</h2>
              <p>{t('cart.readyText')}</p>
            </div>
            <Link className="secondaryButton" to="/">
              <ArrowLeft size={18} />
              <span>{t('cart.continueShopping')}</span>
            </Link>
          </div>
          <div className="lineList cartLineList">
            {cartLines.map((line) => (
              <CartLine key={line.productId} line={line} onQuantityChange={onQuantityChange} />
            ))}
          </div>
        </div>
        <SummaryPanel summary={summary} actionLabel={t('summary.checkout')} onAction={onCheckout} disabled={!cart.length} />
      </div>
    </section>
  )
}

export default CartView
