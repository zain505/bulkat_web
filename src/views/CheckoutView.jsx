import { useState } from 'react'
import { CheckCircle2, CreditCard, Save, Truck, User } from 'lucide-react'
import CartLine from '../components/CartLine'
import SummaryPanel from '../components/SummaryPanel'
import { useI18n } from '../useI18n'
import { errorMessage, formatMoney } from '../utils/commerce'

function CheckoutView({
  auth,
  cart,
  products,
  summary,
  apiRequest,
  onLogin,
  onQuantityChange,
  onOrderPlaced,
  orderResult,
}) {
  const { locale, t } = useI18n()
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: auth.user?.name || '',
    address: '',
    phone: auth.user?.mobile || '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const placeOrder = async (event) => {
    event.preventDefault()

    if (!auth.token) {
      onLogin()
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('post', '/orders', {
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        deliveryInfo,
        paymentMethod: 'COD',
      })
      onOrderPlaced(data.order)
      setMessage(t('checkout.orderSuccess'))
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (orderResult) {
    return (
      <section className="resultPanel">
        <CheckCircle2 size={44} />
        <h1>{t('checkout.orderPlaced')}</h1>
        <p>{orderResult.orderNumber}</p>
        <strong>{formatMoney(orderResult.totals.grandTotal, locale)}</strong>
      </section>
    )
  }

  if (!cart.length) {
    return <div className="emptyState">{t('checkout.empty')}</div>
  }

  return (
    <section className="splitLayout">
      <div>
        <div className="sectionTitle">
          <Truck size={22} />
          <h1>{t('checkout.title')}</h1>
        </div>
        {!auth.token && (
          <div className="notice">
            <User size={18} />
            <span>{t('checkout.loginNotice')}</span>
          </div>
        )}
        {message && <div className="formMessage">{message}</div>}
        <div className="lineList compact">
          {summary.items.map((line) => (
            <CartLine
              key={line.productId}
              line={{ ...line, product: products.find((item) => item.id === line.productId) }}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
        <form className="panelForm" onSubmit={placeOrder}>
          <div className="twoColumns">
            <label>
              {t('checkout.name')}
              <input
                value={deliveryInfo.name}
                onChange={(event) => setDeliveryInfo({ ...deliveryInfo, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t('checkout.phone')}
              <input
                value={deliveryInfo.phone}
                onChange={(event) => setDeliveryInfo({ ...deliveryInfo, phone: event.target.value })}
                required
              />
            </label>
          </div>
          <label>
            {t('checkout.address')}
            <textarea
              value={deliveryInfo.address}
              onChange={(event) => setDeliveryInfo({ ...deliveryInfo, address: event.target.value })}
              required
            />
          </label>
          <div className="paymentOption">
            <CreditCard size={18} />
            <span>{t('checkout.cashOnDelivery')}</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="buttonRow">
            <button className="primaryButton" type="submit" disabled={loading}>
              <Save size={18} />
              <span>{t('checkout.placeOrder')}</span>
            </button>
            {!auth.token && (
              <button className="secondaryButton" type="button" onClick={onLogin}>
                <User size={18} />
                <span>{t('checkout.login')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
      <SummaryPanel summary={summary} />
    </section>
  )
}

export default CheckoutView
