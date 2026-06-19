import { useState } from 'react'
import { BadgePercent, Minus, Package, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '../useI18n'
import { formatMoney, getLocalizedLineProductName } from '../utils/commerce'

function CartLine({ line, onQuantityChange }) {
  const { language, locale, t } = useI18n()
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(line.product?.imageUrl) && !imageFailed
  const productName = getLocalizedLineProductName(line, language)
  const sku = line.product?.sku
  const hasSavings = Number(line.lineDiscount) > 0

  return (
    <article className="cartLine">
      <div className="cartLineMedia">
        {showImage ? (
          <img src={line.product.imageUrl} alt={productName} onError={() => setImageFailed(true)} />
        ) : (
          <div className="cartImageFallback">
            <Package size={24} />
          </div>
        )}
      </div>

      <div className="cartLineDetails">
        <div className="cartLineTitleRow">
          <h3>{productName}</h3>
          {line.bulkApplied && <span className="statusPill good">{t('cart.bulkPrice')}</span>}
        </div>
        <div className="cartMetaRow">
          {sku && (
            <span>
              {t('productCard.sku')}: {sku}
            </span>
          )}
          <span>{t('cart.unitPrice')}: {formatMoney(line.appliedUnitPrice, locale)}</span>
        </div>
        {hasSavings && (
          <span className="cartSaving">
            <BadgePercent size={14} />
            {t('cart.savings', { amount: formatMoney(line.lineDiscount, locale) })}
          </span>
        )}
      </div>

      <div className="cartLineControls">
        <span>{t('productDetail.quantity')}</span>
        <div className="quantityControl">
          <button
            type="button"
            onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
            title={t('cart.decrease')}
            aria-label={t('cart.decrease')}
            disabled={line.quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <strong>{line.quantity}</strong>
          <button
            type="button"
            onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
            title={t('cart.increase')}
            aria-label={t('cart.increase')}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="cartLineTotal">
        <span>{t('cart.lineTotal')}</span>
        <strong>{formatMoney(line.lineSubtotal, locale)}</strong>
      </div>

      <button
        className="iconButton danger cartLineRemove"
        type="button"
        onClick={() => onQuantityChange(line.productId, 0)}
        title={t('cart.remove')}
        aria-label={t('cart.remove')}
      >
        <Trash2 size={18} />
      </button>
    </article>
  )
}

export default CartLine
