import { useCallback, useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { translateStatus } from '../i18nCore'
import { useI18n } from '../useI18n'
import { errorMessage, formatMoney } from '../utils/commerce'

function OrdersView({ apiRequest }) {
  const { locale, t } = useI18n()
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest('get', '/orders/my')
      setOrders(data.orders)
      setMessage('')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }, [apiRequest])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <section>
      <div className="sectionTitle">
        <CreditCard size={22} />
        <h1>{t('orders.title')}</h1>
      </div>
      {message && <div className="formMessage">{message}</div>}
      <div className="lineList">
        {orders.length === 0 && <div className="emptyState">{t('orders.empty')}</div>}
        {orders.map((order) => (
          <article className="orderLine" key={order.id}>
            <div>
              <h3>{order.orderNumber}</h3>
              <p>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt))}</p>
            </div>
            <span className="statusPill">{translateStatus(t, order.orderStatus)}</span>
            <strong>{formatMoney(order.grandTotal, locale)}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export default OrdersView
