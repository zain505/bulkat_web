import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Boxes,
  CircleDollarSign,
  Maximize2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Video,
} from 'lucide-react'
import { translateStatus } from '../i18nCore'
import { useI18n } from '../useI18n'
import {
  formatMoney,
  getLocalizedCategoryName,
  getLocalizedDescription,
  getLocalizedProductName,
  selectUnitPrice,
} from '../utils/commerce'

function attachmentUrl(attachment) {
  if (typeof attachment === 'string') return attachment.trim()

  return String(attachment?.url || attachment?.mediaUrl || attachment?.imageUrl || attachment?.videoUrl || '').trim()
}

function attachmentType(attachment, fallback = 'image') {
  const rawType = String(attachment?.type || attachment?.mediaType || '').toLowerCase()
  const url = attachmentUrl(attachment)

  if (rawType.includes('video')) return 'video'
  if (rawType.includes('image')) return 'image'
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url)) return 'video'

  return fallback
}

function buildAttachments(productAttachments, videoUrl, images) {
  const seen = new Set()
  const attachments = []
  const addAttachment = (attachment, fallbackType = 'image') => {
    const url = attachmentUrl(attachment)
    const type = attachmentType(attachment, fallbackType)
    const key = `${type}:${url}`

    if (!url || seen.has(key)) return

    seen.add(key)
    attachments.push({ type, url })
  }

  ;(Array.isArray(productAttachments) ? productAttachments : []).forEach((attachment) => {
    addAttachment(attachment, 'image')
  })
  images.forEach((image) => addAttachment({ type: 'image', url: image }, 'image'))

  if (videoUrl) {
    addAttachment({ type: 'video', url: videoUrl }, 'video')
  }

  return attachments
}

function ProductDetailView({ product, onBack, onAddToCart, onZoomImage }) {
  const { language, locale, t } = useI18n()
  const images = useMemo(
    () => (product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []),
    [product.imageUrl, product.images],
  )
  const attachments = useMemo(
    () => buildAttachments(product.attachments, product.videoUrl, images),
    [images, product.attachments, product.videoUrl],
  )
  const attachmentSignature = attachments.map((attachment) => `${attachment.type}:${attachment.url}`).join('|')
  const bulkPrices = product.bulkPrices || []
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0)
  const [attachmentFailed, setAttachmentFailed] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const activeAttachment = attachments[activeAttachmentIndex] || null
  const stockQuantity = Math.max(0, Number(product.stockQuantity) || 0)
  const maxQuantity = Math.max(1, stockQuantity)
  const inStock = stockQuantity > 0
  const appliedUnitPrice = selectUnitPrice(product, quantity)
  const retailUnitPrice = Number(product.retailPrice)
  const lineSubtotal = appliedUnitPrice * quantity
  const lineSavings = Math.max(0, (retailUnitPrice - appliedUnitPrice) * quantity)
  const unitSavings = Math.max(0, retailUnitPrice - appliedUnitPrice)
  const unitSavingsPercent =
    retailUnitPrice > 0 && unitSavings > 0 ? Math.round((unitSavings / retailUnitPrice) * 100) : 0
  const bestBulkPrice = bulkPrices
    .map((rule) => Number(rule.unitPrice))
    .filter((price) => price > 0 && price < retailUnitPrice)
    .sort((a, b) => a - b)[0]
  const bestSavingsPercent =
    retailUnitPrice > 0 && bestBulkPrice ? Math.round(((retailUnitPrice - bestBulkPrice) / retailUnitPrice) * 100) : 0
  const currentTier = bulkPrices
    .filter((rule) => Number(rule.minQuantity) <= quantity)
    .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity))[0]
  const nextTier = bulkPrices.find((rule) => Number(rule.minQuantity) > quantity && Number(rule.minQuantity) <= stockQuantity)
  const nextTierGap = nextTier ? Number(nextTier.minQuantity) - quantity : 0
  const tierOptions = [
    { minQuantity: 1, unitPrice: retailUnitPrice, base: true },
    ...bulkPrices,
  ]
  const productName = getLocalizedProductName(product, language)
  const categoryName = getLocalizedCategoryName(product, language)
  const productDescription = getLocalizedDescription(product, language, t('productCard.noDescription'))
  const translatedStatus = translateStatus(t, product.status)
  const availabilityClassName = inStock ? 'statusPill good' : 'statusPill bad'
  const availabilityLabel = inStock
    ? t('productDetail.readyToOrder')
    : t('productDetail.availableUnits', { count: stockQuantity })
  const purchaseTierNote = nextTier
    ? t('productDetail.nextTier', { count: nextTierGap })
    : bulkPrices.length
      ? t('productDetail.maxTier')
      : t('productDetail.noBulk')
  const heroStats = [
    {
      icon: Boxes,
      label: t('productDetail.stock'),
      value: t('productDetail.availableUnits', { count: stockQuantity }),
      detail: inStock ? t('productDetail.readyToOrder') : translatedStatus,
    },
    ...(bulkPrices.length
      ? [
          {
            icon: Sparkles,
            label: t('productDetail.bestBulk'),
            value: bestBulkPrice ? formatMoney(bestBulkPrice, locale) : t('productDetail.noBulk'),
            detail: bestSavingsPercent
              ? t('productDetail.savePercent', { percent: bestSavingsPercent })
              : t('productDetail.retailPrice'),
          },
        ]
      : []),
  ]

  useEffect(() => {
    setActiveAttachmentIndex(0)
    setAttachmentFailed(false)
    setQuantity(1)
  }, [attachmentSignature, product.id])

  const setSafeQuantity = (nextQuantity) => {
    setQuantity(Math.min(maxQuantity, Math.max(1, Number(nextQuantity) || 1)))
  }

  const addSelectedQuantity = () => {
    onAddToCart(product.id, quantity)
  }

  return (
    <section className="productDetailShell">
      <div className="detailTopbar">
        <button className="secondaryButton detailBackButton" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>{t('productDetail.back')}</span>
        </button>
      </div>

      <div className="productDetailGrid">
        <section className="detailGallery" aria-label={t('productDetail.attachmentsLabel', { name: productName })}>
          <div className="detailHeroImage">
            {activeAttachment && !attachmentFailed ? (
              activeAttachment.type === 'video' ? (
                <div className="detailVideoViewer">
                  <video src={activeAttachment.url} controls preload="metadata" />
                </div>
              ) : (
                <button
                  className="detailImageButton"
                  type="button"
                  onClick={() => onZoomImage({ url: activeAttachment.url, alt: productName })}
                  title={t('productDetail.zoomImage')}
                >
                  <img src={activeAttachment.url} alt={productName} onError={() => setAttachmentFailed(true)} />
                  <span className="zoomHint">
                    <Maximize2 size={18} />
                    <span>{t('productDetail.zoom')}</span>
                  </span>
                  <span className="detailImageShine" aria-hidden="true" />
                </button>
              )
            ) : (
              <div className="detailImageFallback">
                <Package size={42} />
                <span>{t('productCard.noImage')}</span>
              </div>
            )}
          </div>

          {attachments.length > 1 && (
            <div className="thumbnailRail">
              {attachments.map((attachment, index) => (
                <button
                  className={index === activeAttachmentIndex ? 'thumbnailButton active' : 'thumbnailButton'}
                  type="button"
                  key={`${attachment.type}-${attachment.url}`}
                  onClick={() => {
                    setActiveAttachmentIndex(index)
                    setAttachmentFailed(false)
                  }}
                  title={attachment.type === 'video' ? t('productDetail.video') : t('productDetail.viewImage')}
                  aria-label={attachment.type === 'video' ? t('productDetail.video') : t('productDetail.viewImage')}
                  aria-pressed={index === activeAttachmentIndex}
                >
                  {attachment.type === 'video' ? (
                    <span className="thumbnailVideoThumb">
                      <Video size={20} />
                    </span>
                  ) : (
                    <img src={attachment.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detailInfo">
          <div className="detailTitleBlock">
            <div className="detailTitleTop">
              <span className="eyebrow">{categoryName}</span>
              <span className={availabilityClassName}>{availabilityLabel}</span>
            </div>
            <h1>{productName}</h1>
            <p>{productDescription}</p>

            <div className="detailPriceBand">
              <CircleDollarSign size={22} />
              <div>
                <span>{t('productDetail.currentUnit')}</span>
                <strong>{formatMoney(appliedUnitPrice, locale)}</strong>
              </div>
              <em className={unitSavingsPercent ? 'savingsPill' : 'savingsPill muted'}>
                {unitSavingsPercent
                  ? t('productDetail.savePercent', { percent: unitSavingsPercent })
                  : t('productDetail.retailPrice')}
              </em>
            </div>
          </div>

          <div className="detailStats">
            {heroStats.map((stat) => {
              const Icon = stat.icon

              return (
                <div className="detailStatCard" key={stat.label}>
                  <Icon size={18} />
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.detail}</small>
                </div>
              )
            })}
          </div>

          {bulkPrices.length > 0 && (
            <section className="bulkPlanner">
              <div className="inlineHeader">
                <h2>{t('productDetail.bulkPricing')}</h2>
                {currentTier && <span className="statusPill good">{t('productDetail.tierApplied')}</span>}
              </div>

              <div className="bulkTierGrid">
                {tierOptions.map((tier, index) => {
                  const isBest = !tier.base && index === tierOptions.length - 1
                  const isDisabled = !inStock || tier.minQuantity > stockQuantity
                  const isActive = tier.base ? !currentTier : currentTier?.minQuantity === tier.minQuantity
                  const tierSavings = Math.max(0, retailUnitPrice - Number(tier.unitPrice))
                  const savingsPercent = retailUnitPrice > 0 ? Math.round((tierSavings / retailUnitPrice) * 100) : 0

                  return (
                    <button
                      className={isActive ? 'bulkTierOption active' : 'bulkTierOption'}
                      type="button"
                      key={`${product.id}-tier-${tier.minQuantity}`}
                      onClick={() => setSafeQuantity(tier.minQuantity)}
                      disabled={isDisabled}
                    >
                      <span className="bulkTierQty">{t('productDetail.unitsPlus', { qty: tier.minQuantity })}</span>
                      <strong>{formatMoney(tier.unitPrice, locale)}</strong>
                      <small>
                        {tier.base
                          ? t('productDetail.retailPrice')
                          : t('productDetail.lessEach', {
                              amount: formatMoney(tierSavings, locale),
                              percent: savingsPercent ? ` (${savingsPercent}%)` : '',
                            })}
                      </small>
                      <span className="bulkTierMeter" aria-hidden="true">
                        <span />
                      </span>
                      <span className="bulkTierFooter">
                        {isActive && <em>{t('productDetail.activeTier')}</em>}
                        {isBest && <em>{t('productDetail.bestValue')}</em>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section className="detailPurchase">
            <div className="detailPurchaseHeader">
              <div>
                <span>{t('productDetail.orderSummary')}</span>
                <strong>{t('productDetail.checkoutTotal')}</strong>
              </div>
              {bulkPrices.length > 0 && <span className="purchaseTierNote">{purchaseTierNote}</span>}
            </div>

            <div className="detailPurchaseBody">
              <div className="detailQuantityGroup">
                <span>{t('productDetail.quantity')}</span>
                <div className="quantityControl detailQuantity">
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity - 1)}
                    title={t('cart.decrease')}
                    disabled={!inStock || quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity + 1)}
                    title={t('cart.increase')}
                    disabled={!inStock || quantity >= maxQuantity}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="detailTotal">
                <span>{t('productDetail.each', { price: formatMoney(appliedUnitPrice, locale) })}</span>
                <strong>{formatMoney(lineSubtotal, locale)}</strong>
                {lineSavings > 0 ? (
                  <small>{t('productDetail.saved', { amount: formatMoney(lineSavings, locale) })}</small>
                ) : (
                  <small>{t('productDetail.retailPrice')}</small>
                )}
              </div>

              <button className="primaryButton" type="button" onClick={addSelectedQuantity} disabled={!inStock}>
                <ShoppingCart size={18} />
                <span>{t('productDetail.addQuantity', { count: quantity })}</span>
              </button>
            </div>
          </section>
        </section>
      </div>
    </section>
  )
}

export default ProductDetailView
