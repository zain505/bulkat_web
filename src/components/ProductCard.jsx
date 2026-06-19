import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Package, ShoppingCart } from 'lucide-react'
import { useI18n } from '../useI18n'
import { formatMoney, getLocalizedCategoryName, getLocalizedDescription, getLocalizedProductName } from '../utils/commerce'

function ProductCard({ product, onAddToCart, onOpenDetail }) {
  const { language, locale, t } = useI18n()
  const imageUrls = useMemo(
    () => Array.from(new Set([...(Array.isArray(product.images) ? product.images : []), product.imageUrl].filter(Boolean))),
    [product.imageUrl, product.images],
  )
  const imageSignature = imageUrls.join('|')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [failedImages, setFailedImages] = useState([])
  const failedImageSet = useMemo(() => new Set(failedImages), [failedImages])
  const visibleImages = imageUrls.filter((image) => !failedImageSet.has(image))
  const activeImage = visibleImages[activeImageIndex % Math.max(visibleImages.length, 1)] || ''
  const showImage = Boolean(activeImage)
  const hasCarousel = visibleImages.length > 1
  const bulkPrices = product.bulkPrices || []
  const visibleBulkPrices = bulkPrices.slice(0, 2)
  const hiddenBulkCount = Math.max(0, bulkPrices.length - visibleBulkPrices.length)
  const productName = getLocalizedProductName(product, language)
  const categoryName = getLocalizedCategoryName(product, language)
  const productDescription = getLocalizedDescription(product, language, t('productCard.noDescription'))
  const openDetail = () => onOpenDetail(product.id)

  useEffect(() => {
    setActiveImageIndex(0)
    setFailedImages([])
  }, [imageSignature, product.id])

  const moveImage = (event, direction) => {
    event.stopPropagation()
    setActiveImageIndex((current) => (current + direction + visibleImages.length) % visibleImages.length)
  }

  const selectImage = (event, index) => {
    event.stopPropagation()
    setActiveImageIndex(index)
  }

  const handleImageError = () => {
    if (!activeImage) return

    setFailedImages((current) => (current.includes(activeImage) ? current : [...current, activeImage]))
    setActiveImageIndex(0)
  }

  return (
    <article className="productCard">
      <button
        className="productCardHitArea"
        type="button"
        onClick={openDetail}
        aria-label={`${t('productCard.detail')}: ${productName}`}
      />
      <div className={hasCarousel ? 'productMedia productMediaCarousel' : 'productMedia'}>
        {showImage ? (
          <>
            <img src={activeImage} alt={productName} onError={handleImageError} />
            {hasCarousel && (
              <>
                <button
                  className="productMediaNav previous"
                  type="button"
                  onClick={(event) => moveImage(event, -1)}
                  title={t('productCard.previousImage')}
                  aria-label={t('productCard.previousImage')}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="productMediaNav next"
                  type="button"
                  onClick={(event) => moveImage(event, 1)}
                  title={t('productCard.nextImage')}
                  aria-label={t('productCard.nextImage')}
                >
                  <ChevronRight size={16} />
                </button>
                <div className="productMediaDots" aria-hidden="true">
                  {visibleImages.map((image, index) => (
                    <button
                      className={index === activeImageIndex ? 'active' : undefined}
                      type="button"
                      key={image}
                      onClick={(event) => selectImage(event, index)}
                      tabIndex={-1}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="productImageFallback">
            <Package size={30} />
            <span>{t('productCard.noImage')}</span>
          </div>
        )}
      </div>
      <div className="productBody">
        <div>
          <div className="productMeta">
            <span className="eyebrow">{categoryName}</span>
            <span className="skuPill">
              {t('productCard.sku')} {product.sku}
            </span>
          </div>
          <h3>{productName}</h3>
          <p>{productDescription}</p>
        </div>
        <div className="priceRow">
          <strong>{formatMoney(product.retailPrice, locale)}</strong>
          <span>{t('productCard.inStock', { count: product.stockQuantity })}</span>
        </div>
        {bulkPrices.length > 0 && (
          <div className="bulkList">
            {visibleBulkPrices.map((rule) => (
              <span key={`${product.id}-${rule.minQuantity}`}>
                {t('productCard.bulkAt', {
                  qty: rule.minQuantity,
                  price: formatMoney(rule.unitPrice, locale),
                })}
              </span>
            ))}
            {hiddenBulkCount > 0 && <span>{t('productCard.moreBulk', { count: hiddenBulkCount })}</span>}
          </div>
        )}
        <div className="cardActions">
          <button className="secondaryButton" type="button" onClick={openDetail}>
            <Eye size={18} />
            <span>{t('productCard.detail')}</span>
          </button>
          <button
            className="primaryButton"
            type="button"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stockQuantity <= 0}
          >
            <ShoppingCart size={18} />
            <span>{t('productCard.add')}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
