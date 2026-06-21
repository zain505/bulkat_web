import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Headphones,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
} from 'lucide-react'
import heroImage from '../assets/logo.png'
import ProductCard from '../components/ProductCard'
import { useI18n } from '../useI18n'
import { getLocalizedName } from '../utils/commerce'

const SHELF_PRODUCT_LIMIT = 12

function getBestDealScore(product) {
  const retailPrice = Number(product.retailPrice || 0)
  if (retailPrice <= 0) return 0

  const bestBulkPrice = (product.bulkPrices || [])
    .map((rule) => Number(rule.unitPrice || 0))
    .filter((price) => price > 0 && price < retailPrice)
    .sort((a, b) => a - b)[0]

  return bestBulkPrice ? (retailPrice - bestBulkPrice) / retailPrice : 0
}

function getSearchSignal(product) {
  const stockScore = Math.min(Number(product.stockQuantity || 0), 150)
  const imageScore = product.imageUrl ? 30 : 0
  const bulkScore = (product.bulkPrices || []).length * 14
  const descriptionScore = Math.min(String(product.description || '').length, 120) / 6

  return stockScore + imageScore + bulkScore + descriptionScore
}

function ProductCarousel({
  title,
  description,
  products,
  showMoreLabel,
  scrollPreviousLabel,
  scrollNextLabel,
  onShowMore,
  onAddToCart,
  onOpenDetail,
}) {
  const trackRef = useRef(null)

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
  }, [products.length, title])

  if (!products.length) {
    return null
  }

  const scrollCarousel = (direction) => {
    const track = trackRef.current
    if (!track) return

    const isRtl = document.documentElement.dir === 'rtl'
    const distance = Math.max(260, track.clientWidth * 0.82)
    track.scrollBy({
      left: (isRtl ? -direction : direction) * distance,
      behavior: 'smooth',
    })
  }

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore()
      return
    }

    scrollCarousel(1)
  }

  return (
    <section className="productCarouselSection" aria-label={title}>
      <div className="carouselHeader">
        <div className="carouselTitle">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="carouselActions">
          <button
            className="iconButton"
            type="button"
            onClick={() => scrollCarousel(-1)}
            title={scrollPreviousLabel}
            aria-label={scrollPreviousLabel}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="iconButton"
            type="button"
            onClick={() => scrollCarousel(1)}
            title={scrollNextLabel}
            aria-label={scrollNextLabel}
          >
            <ChevronRight size={18} />
          </button>
          <button className="secondaryButton carouselMoreButton" type="button" onClick={handleShowMore}>
            <span>{showMoreLabel}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="carouselTrack" ref={trackRef}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </section>
  )
}

function ShopView({
  categories,
  products,
  activeCategory,
  searchTerm,
  appliedSearchTerm = '',
  pagination,
  isLoading = false,
  onCategoryChange,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onAddToCart,
  onOpenDetail,
}) {
  const { language, t } = useI18n()
  const activeCategories = useMemo(
    () => categories.filter((category) => category.status === 'ACTIVE'),
    [categories],
  )
  const productPool = useMemo(
    () => products.filter((product) => product.status === 'ACTIVE'),
    [products],
  )
  const categoryShelves = useMemo(
    () =>
      activeCategories
        .map((category) => ({
          category,
          products: productPool
            .filter((product) => Number(product.categoryId) === Number(category.id))
            .slice(0, SHELF_PRODUCT_LIMIT),
        }))
        .filter((shelf) => shelf.products.length > 0)
        .slice(0, 4),
    [activeCategories, productPool],
  )
  const mostSearchedProducts = useMemo(
    () =>
      [...productPool]
        .sort((first, second) => getSearchSignal(second) - getSearchSignal(first))
        .slice(0, SHELF_PRODUCT_LIMIT),
    [productPool],
  )
  const valueDealProducts = useMemo(
    () =>
      [...productPool]
        .sort((first, second) => {
          const dealDifference = getBestDealScore(second) - getBestDealScore(first)
          if (dealDifference !== 0) return dealDifference

          return Number(first.retailPrice || 0) - Number(second.retailPrice || 0)
        })
        .slice(0, SHELF_PRODUCT_LIMIT),
    [productPool],
  )
  const [activePromiseIndex, setActivePromiseIndex] = useState(0)
  const promisePoints = [
    {
      icon: BadgeCheck,
      title: t('shop.authenticityTitle'),
      text: t('shop.authenticityText'),
    },
    {
      icon: Handshake,
      title: t('shop.buyerComfortTitle'),
      text: t('shop.buyerComfortText'),
    },
    {
      icon: Sparkles,
      title: t('shop.backedTitle'),
      text: t('shop.backedText'),
    },
  ]
  const isHomeMode = !activeCategory && !appliedSearchTerm
  const resultLabel =
    pagination?.total > 0
      ? t('shop.resultLabel', { from: pagination.from, to: pagination.to, total: pagination.total })
      : t('shop.zeroItems')
  const activeCategoryCount = activeCategories.length
  const trustHighlights = [
    {
      icon: ShieldCheck,
      title: t('shop.guaranteeTitle'),
      text: t('shop.guaranteeText'),
    },
    {
      icon: RotateCcw,
      title: t('shop.refundTitle'),
      text: t('shop.refundText'),
    },
    {
      icon: Truck,
      title: t('shop.deliveryTitle'),
      text: t('shop.deliveryText'),
    },
    {
      icon: Headphones,
      title: t('shop.supportTitle'),
      text: t('shop.supportText'),
    },
  ]
  const heroSignalCards = [
    {
      icon: Sparkles,
      title: t('shop.valueDealsTitle'),
      meta: t('shop.activeItems', { count: pagination?.total || products.length }),
    },
    {
      icon: Search,
      title: t('shop.mostSearchedTitle'),
      meta: t('shop.categoryCount', { count: activeCategoryCount }),
    },
    {
      icon: BadgeCheck,
      title: t('shop.promiseTitle'),
      meta: t('shop.genuineBadge'),
    },
  ]
  const trustRibbon = (
    <section className="trustRibbon" aria-label={t('shop.trustSectionLabel')}>
      {trustHighlights.map((item) => {
        const Icon = item.icon

        return (
          <article className="trustCard" key={item.title}>
            <Icon size={20} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        )
      })}
    </section>
  )

  useEffect(() => {
    if (!isHomeMode || typeof window === 'undefined') return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const rotationTimer = window.setInterval(() => {
      setActivePromiseIndex((current) => (current + 1) % promisePoints.length)
    }, 4200)

    return () => window.clearInterval(rotationTimer)
  }, [isHomeMode, promisePoints.length])

  return (
    <section className="shopGrid">
      <aside className="categoryRail">
        <div className="sectionTitle">
          <Tags size={20} />
          <h2>{t('shop.categories')}</h2>
        </div>
        <button
          className="categoryChip resetCategoryChip"
          type="button"
          onClick={() => onCategoryChange('')}
        >
          <span>{t('shop.allProducts')}</span>
          <small>{t('shop.allProductsHint')}</small>
        </button>
        {activeCategories.map((category) => (
          <button
            className={Number(activeCategory) === Number(category.id) ? 'categoryChip active' : 'categoryChip'}
            type="button"
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            <span>{getLocalizedName(category, language)}</span>
          </button>
        ))}
        <div className="guaranteePanel" aria-label={t('shop.trustPanelLabel')}>
          <BadgeCheck size={18} />
          <strong>{t('shop.promiseTitle')}</strong>
          <p>{t('shop.promiseText')}</p>
          <div className="guaranteeBadges">
            <span>{t('shop.genuineBadge')}</span>
            <span>{t('shop.refundBadge')}</span>
          </div>
        </div>
      </aside>

      <section className="catalogPane">
        <section className="shopIntro">
          <div className="shopIntroCopy">
            <span className="eyebrow">{t('shop.eyebrow')}</span>
            <h1>{t('shop.heroTitle')}</h1>
            <span className="heroTagline">{t('shop.heroTagline')}</span>
          </div>
          <div className="shopIntroMedia" aria-hidden="true">
            <div className="heroSignalDeck">
              {heroSignalCards.map((card, index) => {
                const Icon = card.icon

                return (
                  <span className={`heroSignalCard heroSignalCard${index + 1}`} key={card.title}>
                    <Icon size={15} />
                    <span>
                      <strong>{card.title}</strong>
                      <small>{card.meta}</small>
                    </span>
                    <i />
                  </span>
                )
              })}
            </div>
            <div className="heroActivityRail">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="heroOrbit" />
            <div className="heroLogoFrame">
              <img src={heroImage} alt="" />
            </div>
            <span className="heroMediaBadge heroMediaBadgeTop">{t('shop.genuineBadge')}</span>
            <span className="heroMediaBadge heroMediaBadgeBottom">{t('shop.refundBadge')}</span>
          </div>
        </section>

        <div className="catalogHeader">
          <div>
            <h2>{isHomeMode ? t('shop.findProductsTitle') : t('shop.productsTitle')}</h2>
            <p>{isHomeMode ? t('shop.findProductsText') : isLoading ? t('shop.loadingProducts') : resultLabel}</p>
          </div>
          <form
            className="searchForm"
            onSubmit={(event) => {
              event.preventDefault()
              onSearchSubmit()
            }}
          >
            <label className="searchBox">
              <Search size={18} />
              <input
                aria-label={t('shop.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t('shop.searchPlaceholder')}
              />
            </label>
            <button className="primaryButton searchButton" type="submit" disabled={isLoading}>
              <Search size={18} />
              <span>{t('shop.search')}</span>
            </button>
          </form>
        </div>

        {isHomeMode ? (
          <section className="homeShowcase" aria-label={t('shop.homeSectionsLabel')}>
            <section
              className="brandPromiseBand"
              aria-label={t('shop.promiseBandTitle')}
              style={{
                '--promise-progress': `${((activePromiseIndex + 1) / promisePoints.length) * 100}%`,
                '--promise-spot-x': `${48 + activePromiseIndex * 20}%`,
              }}
            >
              <div className="brandPromiseIntro">
                <div className="promiseIntroTop">
                  <span className="eyebrow">{t('shop.promiseEyebrow')}</span>
                  <span className="promiseStepper" aria-hidden="true">
                    {String(activePromiseIndex + 1).padStart(2, '0')}
                    <span>/ {String(promisePoints.length).padStart(2, '0')}</span>
                  </span>
                </div>
                <h2>{t('shop.promiseBandTitle')}</h2>
                <p>{t('shop.promiseBandText')}</p>
                <div className="promiseProgress" aria-hidden="true">
                  <span />
                </div>
                <div className="promiseMiniRail" aria-hidden="true">
                  {promisePoints.map((item, index) => (
                    <span
                      className={index <= activePromiseIndex ? 'isComplete' : undefined}
                      key={`${item.title}-rail`}
                    />
                  ))}
                </div>
              </div>
              <div className="promisePointsGrid">
                {promisePoints.map((item, index) => {
                  const Icon = item.icon
                  const isActive = activePromiseIndex === index

                  return (
                    <button
                      className={isActive ? 'promisePoint active' : 'promisePoint'}
                      type="button"
                      key={item.title}
                      aria-pressed={isActive}
                      onClick={() => setActivePromiseIndex(index)}
                      onFocus={() => setActivePromiseIndex(index)}
                      onMouseEnter={() => setActivePromiseIndex(index)}
                    >
                      <span className="promisePointTop">
                        <span className="promiseIcon">
                          <Icon size={20} />
                        </span>
                        <span className="promiseIndex">{String(index + 1).padStart(2, '0')}</span>
                      </span>
                      <span className="promisePointTitle">{item.title}</span>
                      <span className="promisePointText">{item.text}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {productPool.length > 0 ? (
              <>
                <ProductCarousel
                  title={t('shop.mostSearchedTitle')}
                  description={t('shop.mostSearchedText')}
                  products={mostSearchedProducts}
                  showMoreLabel={t('shop.showMore')}
                  scrollPreviousLabel={t('shop.scrollPrevious')}
                  scrollNextLabel={t('shop.scrollNext')}
                  onAddToCart={onAddToCart}
                  onOpenDetail={onOpenDetail}
                />
                <ProductCarousel
                  title={t('shop.valueDealsTitle')}
                  description={t('shop.valueDealsText')}
                  products={valueDealProducts}
                  showMoreLabel={t('shop.showMore')}
                  scrollPreviousLabel={t('shop.scrollPrevious')}
                  scrollNextLabel={t('shop.scrollNext')}
                  onAddToCart={onAddToCart}
                  onOpenDetail={onOpenDetail}
                />
                {categoryShelves.map((shelf) => {
                  const categoryName = getLocalizedName(shelf.category, language)

                  return (
                    <ProductCarousel
                      key={shelf.category.id}
                      title={categoryName}
                      description={t('shop.categoryShelfText', { category: categoryName })}
                      products={shelf.products}
                      showMoreLabel={t('shop.showMore')}
                      scrollPreviousLabel={t('shop.scrollPrevious')}
                      scrollNextLabel={t('shop.scrollNext')}
                      onShowMore={() => onCategoryChange(shelf.category.id)}
                      onAddToCart={onAddToCart}
                      onOpenDetail={onOpenDetail}
                    />
                  )
                })}
              </>
            ) : (
              <div className="emptyState">{t('shop.noProducts')}</div>
            )}
          </section>
        ) : (
          <>
            {products.length > 0 ? (
              <div className="productGrid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="emptyState">{t('shop.noProducts')}</div>
            )}

            {pagination?.totalPages > 1 && (
              <div className="catalogFooter">
                <div className="paginationControls">
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={isLoading || !pagination.hasPreviousPage}
                  >
                    <ChevronLeft size={18} />
                    <span>{t('shop.previous')}</span>
                  </button>
                  <span className="pageStatus">
                    {t('shop.pageStatus', { page: pagination.page, totalPages: pagination.totalPages })}
                  </span>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={isLoading || !pagination.hasNextPage}
                  >
                    <span>{t('shop.next')}</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {trustRibbon}
      </section>
    </section>
  )
}

export default ShopView
