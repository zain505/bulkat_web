export function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

export function formatMoney(value, locale = 'en-PK') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.'
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function roundNumber(value, precision = 4) {
  const factor = 10 ** precision
  return Math.round(Number(value || 0) * factor) / factor
}

export const defaultCommerceSettings = {
  taxRate: 0.05,
  taxPercent: 5,
  deliveryCharge: 250,
  freeDeliveryOver: 10000,
}

export function normalizeCommerceSettings(data = {}) {
  const source = data?.settings || data || {}
  const sourceTaxRate =
    source.taxRate ?? (source.taxPercent !== undefined && source.taxPercent !== null ? Number(source.taxPercent) / 100 : undefined)
  const taxRate = Math.min(Math.max(toNumber(sourceTaxRate, defaultCommerceSettings.taxRate), 0), 1)
  const deliveryCharge = Math.max(0, toNumber(source.deliveryCharge, defaultCommerceSettings.deliveryCharge))
  const freeDeliveryOver = Math.max(0, toNumber(source.freeDeliveryOver, defaultCommerceSettings.freeDeliveryOver))

  return {
    taxRate: roundNumber(taxRate),
    taxPercent: roundNumber(taxRate * 100, 2),
    deliveryCharge: roundNumber(deliveryCharge, 2),
    freeDeliveryOver: roundNumber(freeDeliveryOver, 2),
  }
}

function normalizeBulkPrices(bulkPrices = [], productId = 0) {
  if (!Array.isArray(bulkPrices)) {
    return []
  }

  return bulkPrices
    .map((rule) => ({
      productId: toNumber(rule?.productId, productId),
      minQuantity: toNumber(rule?.minQuantity),
      unitPrice: toNumber(rule?.unitPrice),
    }))
    .filter((rule) => rule.minQuantity > 0 && rule.unitPrice > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

function mediaUrlFromValue(value) {
  if (typeof value === 'string') return value.trim()

  return String(value?.url || value?.mediaUrl || value?.imageUrl || value?.videoUrl || '').trim()
}

function inferMediaType(value, fallback = 'image') {
  const rawType = String(value?.type || value?.mediaType || value?.media_type || '').toLowerCase()
  const url = mediaUrlFromValue(value)

  if (rawType.includes('video')) return 'video'
  if (rawType.includes('image')) return 'image'
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url)) return 'video'

  return fallback
}

function normalizeProductImages(product) {
  const rawImages = [
    product?.imageUrl,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.imageUrls) ? product.imageUrls : []),
    ...(Array.isArray(product?.pictures) ? product.pictures : []),
  ]

  return Array.from(
    new Set(
      rawImages
        .map((image) => {
          if (typeof image === 'string') return image
          return image?.imageUrl || image?.url || ''
        })
        .map((image) => image.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeProductVideo(product) {
  const candidates = [
    product?.videoUrl,
    product?.video_url,
    product?.video,
    ...(Array.isArray(product?.videos) ? product.videos : []),
  ]

  return (
    candidates
      .map((video) => {
        if (typeof video === 'string') return video
        return video?.videoUrl || video?.mediaUrl || video?.url || ''
      })
      .map((video) => video.trim())
      .find(Boolean) || ''
  )
}

function normalizeProductAttachments(product, images, videoUrl) {
  const rawAttachments = [
    ...(Array.isArray(product?.attachments) ? product.attachments : []),
    ...(Array.isArray(product?.media) ? product.media : []),
    ...(Array.isArray(product?.productMedia) ? product.productMedia : []),
  ]
  const seen = new Set()
  const attachments = []
  const addAttachment = (value, fallbackType) => {
    const url = mediaUrlFromValue(value)
    const type = inferMediaType(value, fallbackType)
    const key = `${type}:${url}`

    if (!url || seen.has(key)) return

    seen.add(key)
    attachments.push({ type, url, mediaUrl: url })
  }

  rawAttachments.forEach((attachment) => addAttachment(attachment, 'image'))
  images.forEach((image) => addAttachment({ type: 'image', url: image }, 'image'))

  if (videoUrl) {
    addAttachment({ type: 'video', url: videoUrl }, 'video')
  }

  return attachments
}

function normalizeProduct(product) {
  const id = toNumber(product?.id)
  const images = normalizeProductImages(product)
  const videoUrl = normalizeProductVideo(product)

  return {
    id,
    categoryId: toNumber(product?.categoryId),
    categoryName: product?.categoryName || 'Uncategorized',
    categoryNameUrdu: product?.categoryNameUrdu || '',
    slug: product?.slug || '',
    name: product?.name || 'Untitled product',
    nameUrdu: product?.nameUrdu || '',
    sku: product?.sku || 'NO-SKU',
    description: product?.description || '',
    descriptionUrdu: product?.descriptionUrdu || '',
    imageUrl: images[0] || '',
    images,
    videoUrl,
    attachments: normalizeProductAttachments(product, images, videoUrl),
    retailPrice: toNumber(product?.retailPrice),
    stockQuantity: toNumber(product?.stockQuantity),
    status: product?.status || 'ACTIVE',
    bulkPrices: normalizeBulkPrices(product?.bulkPrices, id),
  }
}

function normalizeCategory(category) {
  return {
    id: toNumber(category?.id),
    name: category?.name || 'Untitled category',
    nameUrdu: category?.nameUrdu || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    status: category?.status || 'ACTIVE',
    createdAt: category?.createdAt || '',
  }
}

function localizedValue(primary, secondary, language, fallback = '') {
  if (language === 'ur') {
    return secondary || primary || fallback
  }

  return primary || secondary || fallback
}

export function getLocalizedName(item, language = 'en') {
  return localizedValue(item?.name, item?.nameUrdu, language, '')
}

export function getLocalizedProductName(product, language = 'en') {
  return getLocalizedName(product, language) || 'Untitled product'
}

export function getLocalizedCategoryName(item, language = 'en') {
  return localizedValue(item?.categoryName || item?.name, item?.categoryNameUrdu || item?.nameUrdu, language, 'Uncategorized')
}

export function getLocalizedDescription(item, language = 'en', fallback = '') {
  if (language === 'ur') {
    return item?.descriptionUrdu || fallback
  }

  return localizedValue(item?.description, item?.descriptionUrdu, language, fallback)
}

export function getLocalizedLineProductName(line, language = 'en') {
  return localizedValue(
    line?.product?.name || line?.productName,
    line?.product?.nameUrdu || line?.productNameUrdu,
    language,
    'Untitled product',
  )
}

export function categoriesFromResponse(data) {
  const categories = Array.isArray(data?.categories) ? data.categories : data?.category ? [data.category] : []

  return categories.map(normalizeCategory).filter((category) => category.id > 0)
}

export function productsFromResponse(data) {
  const products = Array.isArray(data?.products) ? data.products : data?.product ? [data.product] : []

  return products.map(normalizeProduct).filter((product) => product.id > 0)
}

export function paginationFromResponse(data, fallback = {}) {
  const pagination = data?.pagination || {}
  const page = Math.max(1, Math.trunc(toNumber(pagination.page, fallback.page || 1)))
  const limit = Math.max(1, Math.trunc(toNumber(pagination.limit, fallback.limit || 12)))
  const total = Math.max(0, Math.trunc(toNumber(pagination.total, fallback.total || 0)))
  const totalPages = Math.max(
    1,
    Math.trunc(toNumber(pagination.totalPages, Math.ceil(total / limit) || 1)),
  )
  const from = Math.max(0, Math.trunc(toNumber(pagination.from, total === 0 ? 0 : (page - 1) * limit + 1)))
  const to =
    from === 0 ? 0 : Math.max(from, Math.trunc(toNumber(pagination.to, Math.min(page * limit, total))))

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: Boolean(pagination.hasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(pagination.hasPreviousPage ?? page > 1),
    from,
    to,
  }
}

export function mergeProductsById(currentProducts = [], nextProducts = []) {
  const productsById = new Map(currentProducts.map((product) => [product.id, product]))

  nextProducts.forEach((product) => {
    productsById.set(product.id, product)
  })

  return Array.from(productsById.values())
}

export function selectUnitPrice(product, quantity) {
  const rule = (product.bulkPrices || [])
    .filter((price) => Number(price.minQuantity) <= quantity)
    .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity))[0]

  return rule ? Number(rule.unitPrice) : Number(product.retailPrice)
}

export function buildLocalSummary(cart, products, commerceSettings = defaultCommerceSettings) {
  const settings = normalizeCommerceSettings(commerceSettings)
  let retailTotal = 0
  let subtotal = 0

  const items = cart
    .map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.productId)
      if (!product) return null

      const retailUnitPrice = Number(product.retailPrice)
      const appliedUnitPrice = selectUnitPrice(product, cartItem.quantity)
      const retailLineTotal = retailUnitPrice * cartItem.quantity
      const lineSubtotal = appliedUnitPrice * cartItem.quantity

      retailTotal += retailLineTotal
      subtotal += lineSubtotal

      return {
        productId: product.id,
        productName: product.name,
        productNameUrdu: product.nameUrdu,
        quantity: cartItem.quantity,
        retailUnitPrice,
        appliedUnitPrice,
        lineSubtotal,
        lineDiscount: retailLineTotal - lineSubtotal,
        bulkApplied: appliedUnitPrice < retailUnitPrice,
      }
    })
    .filter(Boolean)

  const discountTotal = retailTotal - subtotal
  const taxTotal = subtotal * settings.taxRate
  const deliveryCharge = subtotal >= settings.freeDeliveryOver || subtotal === 0 ? 0 : settings.deliveryCharge

  return {
    items,
    totals: {
      retailTotal,
      subtotal,
      discountTotal,
      taxTotal,
      deliveryCharge,
      grandTotal: subtotal + taxTotal + deliveryCharge,
    },
  }
}
