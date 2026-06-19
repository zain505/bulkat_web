import { BadgeCheck, ShieldCheck, Truck } from 'lucide-react'
import { useI18n } from '../useI18n'
import { formatMoney } from '../utils/commerce'

function SummaryPanel({ summary, actionLabel, onAction, disabled }) {
  const { locale, t } = useI18n()
  const itemCount = summary.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <aside className="summaryPanel">
      <div className="summaryPanelHeader">
        <div>
          <span className="eyebrow">{t('summary.orderReady', { count: itemCount })}</span>
          <h2>{t('summary.title')}</h2>
        </div>
        <ShieldCheck size={22} />
      </div>
      <dl className="summaryRows">
        <div>
          <dt>{t('summary.items')}</dt>
          <dd>{formatMoney(summary.totals.subtotal, locale)}</dd>
        </div>
        <div>
          <dt>{t('summary.discount')}</dt>
          <dd>{formatMoney(summary.totals.discountTotal, locale)}</dd>
        </div>
        <div>
          <dt>{t('summary.tax')}</dt>
          <dd>{formatMoney(summary.totals.taxTotal, locale)}</dd>
        </div>
        <div>
          <dt>{t('summary.delivery')}</dt>
          <dd>{formatMoney(summary.totals.deliveryCharge, locale)}</dd>
        </div>
        <div className="grandTotal">
          <dt>{t('summary.total')}</dt>
          <dd>{formatMoney(summary.totals.grandTotal, locale)}</dd>
        </div>
      </dl>
      <div className="summaryAssurance">
        <span>
          <BadgeCheck size={15} />
          {t('summary.verified')}
        </span>
        <span>
          <Truck size={15} />
          {t('summary.deliveryNote')}
        </span>
      </div>
      {onAction && (
        <button className="primaryButton full" type="button" onClick={onAction} disabled={disabled}>
          <Truck size={18} />
          <span>{actionLabel || t('summary.checkout')}</span>
        </button>
      )}
      <p className="summaryFinePrint">{t('summary.checkoutNote')}</p>
    </aside>
  )
}

export default SummaryPanel
