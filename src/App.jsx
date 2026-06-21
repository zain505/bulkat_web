import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowLeft,
  ChevronDown,
  Globe,
  RefreshCw,
} from 'lucide-react'
import { Link, Navigate, Route, Routes, matchPath, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import ImageZoomDialog from './components/ImageZoomDialog'
import Topbar from './components/Topbar'
import { fallbackCategories, fallbackProducts } from './data/fallbackCatalog'
import { I18nProvider } from './I18nProvider'
import { createI18n } from './i18nCore'
import AdminPanel from './views/AdminPanel'
import AuthView from './views/AuthView'
import CartView from './views/CartView'
import CheckoutView from './views/CheckoutView'
import OrdersView from './views/OrdersView'
import ProductDetailView from './views/ProductDetailView'
import ShopView from './views/ShopView'
import {
  buildLocalSummary,
  categoriesFromResponse,
  defaultCommerceSettings,
  errorMessage,
  getLocalizedProductName,
  mergeProductsById,
  normalizeCommerceSettings,
  paginationFromResponse,
  productsFromResponse,
  readStorage,
} from './utils/commerce'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const PRODUCT_PAGE_LIMIT = 24
const HOME_PRODUCT_LIMIT = 100
const ADMIN_PRODUCT_PAGE_LIMIT = 100

const catalogAdminPermissions = [
  'CATEGORY_CREATE',
  'CATEGORY_UPDATE',
  'CATEGORY_DELETE',
  'CATEGORY_INACTIVATE',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_DELETE',
  'PRODUCT_INACTIVATE',
]

const roleAdminPermissions = ['ROLE_MANAGE']
const userAdminPermissions = ['USER_MANAGE', 'ROLE_MANAGE']
const settingsAdminPermissions = ['COMMERCE_SETTINGS_MANAGE']

const adminPermissions = [
  ...catalogAdminPermissions,
  ...roleAdminPermissions,
  ...userAdminPermissions,
  ...settingsAdminPermissions,
]

const pagePaths = {
  shop: '/',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
}

const footerSocialHandles = [
  {
    network: 'Instagram',
    handle: '@bulkat.pk',
    badge: 'IG',
    href: 'https://www.instagram.com/bulkat.pk',
  },
  {
    network: 'Facebook',
    handle: '@BulkatOfficial',
    badge: 'FB',
    href: 'https://www.facebook.com/BulkatOfficial',
  },
  {
    network: 'TikTok',
    handle: '@bulkat.pk',
    badge: 'TT',
    href: 'https://www.tiktok.com/@bulkat.pk',
  },
  {
    network: 'X',
    handle: '@BulkatPK',
    badge: 'X',
    href: 'https://x.com/BulkatPK',
  },
  {
    network: 'YouTube',
    handle: '@BulkatPK',
    badge: 'YT',
    href: 'https://www.youtube.com/@BulkatPK',
  },
  {
    network: 'LinkedIn',
    handle: '/company/bulkat',
    badge: 'IN',
    href: 'https://www.linkedin.com/company/bulkat',
  },
  {
    network: 'WhatsApp',
    handle: '+92 300 111 2855',
    badge: 'WA',
    href: 'https://wa.me/923001112855',
  },
]

const authModePaths = {
  login: '/account/login',
  signup: '/account/signup',
  otp: '/account/otp',
}

const adminTabPaths = {
  catalog: '/admin/catalog',
  roles: '/admin/roles',
  users: '/admin/users',
  settings: '/admin/settings',
}

function buildProductParams({ includeInactive = false, categoryId = 'all', searchTerm = '', page = 1, limit }) {
  const normalizedCategoryId = categoryId || 'all'
  const params = {
    page,
    limit: limit || (includeInactive ? ADMIN_PRODUCT_PAGE_LIMIT : PRODUCT_PAGE_LIMIT),
  }

  if (includeInactive) {
    params.includeInactive = true
  }

  if (normalizedCategoryId !== 'all') {
    params.categoryId = normalizedCategoryId
  }

  const trimmedSearch = searchTerm.trim()
  if (trimmedSearch) {
    params.q = trimmedSearch
  }

  return params
}

function filterLocalProducts(products, { includeInactive = false, categoryId = 'all', searchTerm = '' }) {
  const normalizedCategoryId = categoryId || 'all'
  const normalized = searchTerm.trim().toLowerCase()

  return products.filter((product) => {
    const matchesStatus = includeInactive || product.status === 'ACTIVE'
    const matchesCategory =
      normalizedCategoryId === 'all' || Number(product.categoryId) === Number(normalizedCategoryId)
    const matchesSearch =
      !normalized ||
      [
        product.name,
        product.nameUrdu,
        product.categoryName,
        product.categoryNameUrdu,
        product.sku,
        product.description,
        product.descriptionUrdu,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))

    return matchesStatus && matchesCategory && matchesSearch
  })
}

function paginateLocalProducts(products, { page = 1, limit = PRODUCT_PAGE_LIMIT }) {
  const totalPages = Math.max(1, Math.ceil(products.length / limit))
  const currentPage = Math.min(page, totalPages)
  const offset = (currentPage - 1) * limit
  const pageProducts = products.slice(offset, offset + limit)

  return {
    products: pageProducts,
    pagination: {
      page: currentPage,
      limit,
      total: products.length,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      from: pageProducts.length === 0 ? 0 : offset + 1,
      to: pageProducts.length === 0 ? 0 : Math.min(offset + pageProducts.length, products.length),
    },
  }
}

function hasRouteKey(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key)
}

function getProductRouteKey(pathname) {
  const productMatch = matchPath({ path: '/products/:productKey', end: true }, pathname)
  return productMatch?.params.productKey ? decodeURIComponent(productMatch.params.productKey) : null
}

function getAuthMode(pathname) {
  const authMatch = matchPath({ path: '/account/:mode', end: true }, pathname)
  const mode = authMatch?.params.mode
  return hasRouteKey(authModePaths, mode) ? mode : null
}

function getAdminTab(pathname) {
  const adminMatch = matchPath({ path: '/admin/:tab', end: true }, pathname)
  const tab = adminMatch?.params.tab
  return hasRouteKey(adminTabPaths, tab) ? tab : null
}

function getCurrentView(pathname) {
  if (pathname === pagePaths.shop) return 'shop'
  if (pathname.startsWith('/products/')) return 'productDetail'
  if (pathname.startsWith(pagePaths.cart)) return 'cart'
  if (pathname.startsWith(pagePaths.checkout)) return 'checkout'
  if (pathname.startsWith('/account')) return 'auth'
  if (pathname.startsWith(pagePaths.orders)) return 'orders'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'shop'
}

function getPageTitle(pathname, selectedProduct, orderResult, t, language) {
  const productKey = getProductRouteKey(pathname)
  if (productKey) return `${selectedProduct ? getLocalizedProductName(selectedProduct, language) : t('titles.productDetail')} | Bulkat`
  if (pathname === pagePaths.cart) return `${t('titles.cart')} | Bulkat`
  if (pathname === pagePaths.checkout) return `${orderResult ? t('titles.orderPlaced') : t('titles.checkout')} | Bulkat`
  if (pathname === pagePaths.orders) return `${t('titles.orders')} | Bulkat`

  const authMode = getAuthMode(pathname)
  if (authMode) return `${t(`titles.${authMode}`)} | Bulkat`

  const adminTab = getAdminTab(pathname)
  if (adminTab) {
    const titleKey =
      adminTab === 'catalog'
        ? 'adminCatalog'
        : adminTab === 'roles'
          ? 'adminRoles'
          : adminTab === 'settings'
            ? 'adminSettings'
            : 'adminUsers'
    return `${t(`titles.${titleKey}`)} | Bulkat`
  }

  return `${t('titles.shop')} | Bulkat`
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const view = useMemo(() => getCurrentView(location.pathname), [location.pathname])
  const routeAuthMode = useMemo(() => getAuthMode(location.pathname), [location.pathname])
  const routeAdminTab = useMemo(() => getAdminTab(location.pathname), [location.pathname])
  const productRouteKey = useMemo(() => getProductRouteKey(location.pathname), [location.pathname])
  const authMode = routeAuthMode || 'login'
  const adminTab = routeAdminTab || 'catalog'
  const [language, setLanguage] = useState(() => {
    const storedLanguage = readStorage('commerceLanguage', 'en')
    return storedLanguage === 'ur' ? 'ur' : 'en'
  })
  const i18n = useMemo(() => createI18n(language), [language])
  const { dir, t } = i18n
  const [categories, setCategories] = useState(fallbackCategories)
  const [products, setProducts] = useState(fallbackProducts)
  const [visibleProducts, setVisibleProducts] = useState(fallbackProducts)
  const [activeCategory, setActiveCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [searchRequestId, setSearchRequestId] = useState(0)
  const [productPage, setProductPage] = useState(1)
  const [productPagination, setProductPagination] = useState(() =>
    paginationFromResponse({
      pagination: {
        page: 1,
        limit: PRODUCT_PAGE_LIMIT,
        total: fallbackProducts.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        from: 1,
        to: fallbackProducts.length,
      },
    }),
  )
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [cart, setCart] = useState(() => readStorage('commerceCart', []))
  const [auth, setAuth] = useState(() => readStorage('commerceAuth', { token: '', user: null }))
  const [notice, setNotice] = useState('')
  const [checkoutSummary, setCheckoutSummary] = useState(null)
  const [orderResult, setOrderResult] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [commerceSettings, setCommerceSettings] = useState(defaultCommerceSettings)

  const apiRequest = useCallback(
    async (method, url, data = null, params = null) => {
      const response = await axios.request({
        method,
        baseURL: API_BASE,
        url,
        data,
        params,
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      })

      return response.data.data
    },
    [auth.token],
  )

  const loadProfile = useCallback(async () => {
    if (!auth.token) return

    try {
      const data = await apiRequest('get', '/auth/me')
      setAuth((current) => ({ ...current, user: data.user }))
    } catch {
      setAuth({ token: '', user: null })
    }
  }, [apiRequest, auth.token])

  const loadCommerceSettings = useCallback(async () => {
    try {
      const data = await apiRequest('get', '/settings/commerce')
      setCommerceSettings(normalizeCommerceSettings(data.settings))
    } catch {
      setCommerceSettings(defaultCommerceSettings)
    }
  }, [apiRequest])

  const loadCatalog = useCallback(
    async (includeInactive = false, productOptions = {}) => {
      const productParams = buildProductParams({
        includeInactive,
        categoryId: productOptions.categoryId || 'all',
        searchTerm: productOptions.searchTerm || '',
        page: productOptions.page || 1,
        limit: productOptions.limit,
      })

      if (!includeInactive) {
        setIsCatalogLoading(true)
      }

      try {
        const categoryParams = includeInactive ? { includeInactive: true } : null
        const [categoryData, productData] = await Promise.all([
          apiRequest('get', '/categories', null, categoryParams),
          apiRequest('get', '/products', null, productParams),
        ])
        let nextProducts = productsFromResponse(productData)
        const pagination = paginationFromResponse(productData, {
          page: productParams.page,
          limit: productParams.limit,
          total: nextProducts.length,
        })

        if (includeInactive && pagination.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: pagination.totalPages - 1 }, (_, index) =>
              apiRequest('get', '/products', null, { ...productParams, page: index + 2 }),
            ),
          )
          nextProducts = mergeProductsById(
            nextProducts,
            remainingPages.flatMap((pageData) => productsFromResponse(pageData)),
          )
        }

        setCategories(categoriesFromResponse(categoryData))

        if (includeInactive) {
          setProducts(nextProducts)
        } else {
          setVisibleProducts(nextProducts)
          setProducts((current) => mergeProductsById(current, nextProducts))
          setProductPagination(pagination)
        }

        setNotice('')
      } catch {
        const localProducts = filterLocalProducts(fallbackProducts, {
          includeInactive,
          categoryId: productOptions.categoryId || 'all',
          searchTerm: productOptions.searchTerm || '',
        })
        const localCatalog = paginateLocalProducts(localProducts, {
          page: productOptions.page || 1,
          limit: productOptions.limit || (includeInactive ? ADMIN_PRODUCT_PAGE_LIMIT : PRODUCT_PAGE_LIMIT),
        })

        setCategories(fallbackCategories)
        setProducts(fallbackProducts)

        if (!includeInactive) {
          setVisibleProducts(localCatalog.products)
          setProductPagination(localCatalog.pagination)
        }

        setNotice(t('messages.backendFallback'))
      } finally {
        if (!includeInactive) {
          setIsCatalogLoading(false)
        }
      }
    },
    [apiRequest, t],
  )

  const isHomeCatalogRequest = view === 'shop' && !activeCategory && !appliedSearchTerm

  useEffect(() => {
    if (view === 'admin') return

    loadCatalog(false, {
      categoryId: activeCategory || 'all',
      searchTerm: appliedSearchTerm,
      page: isHomeCatalogRequest ? 1 : productPage,
      limit: isHomeCatalogRequest ? HOME_PRODUCT_LIMIT : PRODUCT_PAGE_LIMIT,
    })
  }, [activeCategory, appliedSearchTerm, isHomeCatalogRequest, loadCatalog, productPage, searchRequestId, view])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    loadCommerceSettings()
  }, [loadCommerceSettings])

  useEffect(() => {
    localStorage.setItem('commerceCart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('commerceAuth', JSON.stringify(auth))
  }, [auth])

  useEffect(() => {
    localStorage.setItem('commerceLanguage', JSON.stringify(language))
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
  }, [dir, language])

  const shopProducts = useMemo(
    () => visibleProducts.filter((product) => product.status === 'ACTIVE'),
    [visibleProducts],
  )

  const cartSummary = useMemo(
    () => buildLocalSummary(cart, products, commerceSettings),
    [cart, commerceSettings, products],
  )
  const summary = checkoutSummary || cartSummary
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const selectedProduct = useMemo(
    () =>
      productRouteKey
        ? products.find(
            (product) => String(product.id) === String(productRouteKey) || product.slug === productRouteKey,
          )
        : null,
    [productRouteKey, products],
  )
  const userPermissions = useMemo(() => auth.user?.permissions || [], [auth.user?.permissions])
  const isSuperAdmin = Boolean(auth.user?.isSuperAdmin)
  const adminAccess = useMemo(
    () => ({
      catalog: isSuperAdmin || userPermissions.some((permission) => catalogAdminPermissions.includes(permission)),
      roles: isSuperAdmin || userPermissions.some((permission) => roleAdminPermissions.includes(permission)),
      users: isSuperAdmin || userPermissions.some((permission) => userAdminPermissions.includes(permission)),
      settings: isSuperAdmin || userPermissions.some((permission) => settingsAdminPermissions.includes(permission)),
    }),
    [isSuperAdmin, userPermissions],
  )
  const allowedAdminTabs = useMemo(
    () => Object.keys(adminTabPaths).filter((tabKey) => adminAccess[tabKey]),
    [adminAccess],
  )
  const defaultAdminTab = allowedAdminTabs[0] || 'catalog'
  const defaultAdminPath = adminTabPaths[defaultAdminTab] || adminTabPaths.catalog
  const canAdmin = isSuperAdmin || userPermissions.some((permission) => adminPermissions.includes(permission))
  const footerPhoneNumbers = [
    {
      label: t('footer.customerCare'),
      value: '+92 300 111 2855',
      href: 'tel:+923001112855',
    },
    {
      label: t('footer.ordersDesk'),
      value: '+92 321 222 2855',
      href: 'tel:+923212222855',
    },
  ]
  const footerFaqs = [
    {
      question: t('footer.faqRefundQuestion'),
      answer: t('footer.faqRefundAnswer'),
    },
    {
      question: t('footer.faqDeliveryQuestion'),
      answer: t('footer.faqDeliveryAnswer'),
    },
    {
      question: t('footer.faqBulkQuestion'),
      answer: t('footer.faqBulkAnswer'),
    },
    {
      question: t('footer.faqSupportQuestion'),
      answer: t('footer.faqSupportAnswer'),
    },
  ]
  const footerColumns = [
    {
      title: t('footer.columnShop'),
      links: [
        { label: t('footer.shopLink'), to: pagePaths.shop },
        { label: t('footer.bulkDealsLink'), to: pagePaths.shop },
        { label: t('footer.cartLink'), to: pagePaths.cart },
        { label: t('footer.checkoutLink'), to: pagePaths.checkout },
        { label: t('footer.ordersLink'), to: pagePaths.orders },
      ],
    },
    {
      title: t('footer.columnSupport'),
      links: [
        {
          label: t('footer.location'),
          href: 'https://www.google.com/maps/search/?api=1&query=Lahore%20Punjab%20Pakistan',
          external: true,
        },
        ...footerPhoneNumbers.map((phone) => ({ label: `${phone.label}: ${phone.value}`, href: phone.href })),
        { label: 'WhatsApp: +92 300 111 2855', href: 'https://wa.me/923001112855', external: true },
        { label: 'support@bulkat.pk', href: 'mailto:support@bulkat.pk' },
      ],
    },
    {
      title: t('footer.columnCompany'),
      links: [
        { label: t('footer.privacyLink'), href: '#footer-privacy' },
        { label: t('footer.legalLink'), href: '#footer-legal' },
        { label: t('footer.sitemapLink'), href: '#footer-sitemap' },
        { label: t('footer.hours'), href: '#footer-hours' },
      ],
    },
    {
      title: t('footer.columnFaqs'),
      links: footerFaqs.map((faq) => ({ label: faq.question, href: '#footer-faqs' })),
    },
  ]
  const footerContactItems = [
    {
      label: t('footer.locationLabel'),
      value: t('footer.location'),
      href: 'https://www.google.com/maps/search/?api=1&query=Lahore%20Punjab%20Pakistan',
      external: true,
    },
    ...footerPhoneNumbers.map((phone) => ({
      label: phone.label,
      value: phone.value,
      href: phone.href,
    })),
    {
      label: 'WhatsApp',
      value: '+92 300 111 2855',
      href: 'https://wa.me/923001112855',
      external: true,
    },
  ]

  useEffect(() => {
    document.title = getPageTitle(location.pathname, selectedProduct, orderResult, t, language)
  }, [language, location.pathname, orderResult, selectedProduct, t])

  const navigateTo = useCallback(
    (path) => {
      navigate(path)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [navigate],
  )

  const setAuthMode = useCallback(
    (nextMode) => {
      navigateTo(authModePaths[nextMode] || authModePaths.login)
    },
    [navigateTo],
  )

  const setAdminTab = useCallback(
    (nextTab) => {
      navigateTo(adminTabPaths[nextTab] || adminTabPaths.catalog)
    },
    [navigateTo],
  )

  const updateCategory = useCallback((categoryId) => {
    setActiveCategory(categoryId || '')
    setProductPage(1)
  }, [])

  const updateSearchTerm = useCallback((value) => {
    setSearchTerm(value)
  }, [])

  const submitSearch = useCallback(() => {
    setProductPage(1)
    setAppliedSearchTerm(searchTerm.trim())
    setSearchRequestId((current) => current + 1)
  }, [searchTerm])

  const updateProductPage = useCallback(
    (page) => {
      setProductPage(Math.min(Math.max(1, page), productPagination.totalPages))
    },
    [productPagination.totalPages],
  )

  const addToCart = (productId, quantity = 1) => {
    const amount = Math.max(1, Number(quantity) || 1)

    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + amount } : item,
        )
      }

      return [...current, { productId, quantity: amount }]
    })
    setOrderResult(null)
  }

  const openProductDetail = (productId) => {
    const product = products.find((item) => Number(item.id) === Number(productId))
    const productKey = product?.slug || productId
    navigateTo(`/products/${encodeURIComponent(productKey)}`)
  }

  const updateCartQuantity = (productId, quantity) => {
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.productId !== productId)
      }

      return current.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    })
    setCheckoutSummary(null)
  }

  const refreshCheckout = useCallback(async () => {
    if (!auth.token || !cart.length) {
      setCheckoutSummary(null)
      return
    }

    try {
      const data = await apiRequest('post', '/checkout/summary', {
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      })
      setCheckoutSummary(data)
    } catch (error) {
      setNotice(errorMessage(error))
      setCheckoutSummary(null)
    }
  }, [apiRequest, auth.token, cart])

  const reloadFullCatalog = useCallback(() => loadCatalog(true), [loadCatalog])

  useEffect(() => {
    if (view === 'checkout') {
      refreshCheckout()
    }
  }, [refreshCheckout, view])

  const handleLogout = () => {
    setAuth({ token: '', user: null })
    navigateTo(pagePaths.shop)
  }

  return (
    <I18nProvider value={i18n}>
      <div className={`appShell lang-${language}`} dir={dir} lang={language}>
      <Topbar
        view={view}
        cartCount={cartCount}
        auth={auth}
        canAdmin={canAdmin}
        adminPath={defaultAdminPath}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      />

      <main className="workspace">
        {notice && (
          <div className="notice">
            <RefreshCw size={18} />
            <span>{notice}</span>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <ShopView
                categories={categories}
                products={shopProducts}
                activeCategory={activeCategory}
                searchTerm={searchTerm}
                appliedSearchTerm={appliedSearchTerm}
                pagination={productPagination}
                isLoading={isCatalogLoading}
                onCategoryChange={updateCategory}
                onSearchChange={updateSearchTerm}
                onSearchSubmit={submitSearch}
                onPageChange={updateProductPage}
                onAddToCart={addToCart}
                onOpenDetail={openProductDetail}
              />
            }
          />
          <Route
            path="/products/:productKey"
            element={
              selectedProduct ? (
                <ProductDetailView
                  product={selectedProduct}
                  onBack={() => navigateTo(pagePaths.shop)}
                  onAddToCart={addToCart}
                  onZoomImage={setZoomImage}
                />
              ) : (
                <section className="emptyDetail">
                  <div className="emptyState">{t('messages.productUnavailable')}</div>
                  <button className="secondaryButton" type="button" onClick={() => navigateTo(pagePaths.shop)}>
                    <ArrowLeft size={18} />
                    <span>{t('productDetail.back')}</span>
                  </button>
                </section>
              )
            }
          />
          <Route
            path="/cart"
            element={
              <CartView
                cart={cart}
                products={products}
                summary={cartSummary}
                onQuantityChange={updateCartQuantity}
                onCheckout={() => navigateTo(pagePaths.checkout)}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutView
                auth={auth}
                cart={cart}
                products={products}
                summary={summary}
                apiRequest={apiRequest}
                onLogin={() => navigateTo(authModePaths.login)}
                onQuantityChange={updateCartQuantity}
                onOrderPlaced={(order) => {
                  setOrderResult(order)
                  setCart([])
                  setCheckoutSummary(null)
                }}
                orderResult={orderResult}
              />
            }
          />
          <Route path="/account" element={<Navigate to={authModePaths.login} replace />} />
          <Route
            path="/account/:mode"
            element={
              routeAuthMode ? (
                <AuthView
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  apiRequest={apiRequest}
                  onAuthenticated={(nextAuth) => {
                    setAuth(nextAuth)
                    navigateTo(pagePaths.shop)
                  }}
                />
              ) : (
                <Navigate to={authModePaths.login} replace />
              )
            }
          />
          <Route
            path="/orders"
            element={auth.user ? <OrdersView apiRequest={apiRequest} /> : <Navigate to={authModePaths.login} replace />}
          />
          <Route path="/admin" element={<Navigate to={defaultAdminPath} replace />} />
          <Route
            path="/admin/:tab"
            element={
              routeAdminTab ? (
                canAdmin && adminAccess[adminTab] ? (
                  <AdminPanel
                    apiRequest={apiRequest}
                    categories={categories}
                    products={products}
                    reloadCatalog={reloadFullCatalog}
                    activeTab={adminTab}
                    onTabChange={setAdminTab}
                    adminAccess={adminAccess}
                    commerceSettings={commerceSettings}
                    onSettingsSaved={(settings) => {
                      setCommerceSettings(normalizeCommerceSettings(settings))
                      loadCommerceSettings()
                    }}
                  />
                ) : canAdmin ? (
                  <Navigate to={defaultAdminPath} replace />
                ) : (
                  <Navigate to={pagePaths.shop} replace />
                )
              ) : (
                <Navigate to={defaultAdminPath} replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={pagePaths.shop} replace />} />
        </Routes>
      </main>

      <footer className="siteFooter" aria-label={t('footer.label')}>
        <div className="siteFooterInner">
          <section className="footerBrandPanel">
            <Link className="footerWordmark" to={pagePaths.shop} aria-label={t('brand')}>
              <span className="footerWordmarkText">BULKAT</span>
              <span className="footerWordmarkMeta">{t('footer.brandMeta')}</span>
            </Link>
            <p className="footerTagline">{t('footer.tagline')}</p>
            <div className="footerContactStrip" aria-label={t('footer.contactTitle')}>
              {footerContactItems.map((item) => (
                <a
                  className="footerContactItem"
                  href={item.href}
                  key={`${item.label}-${item.value}`}
                  rel={item.external ? 'noreferrer' : undefined}
                  target={item.external ? '_blank' : undefined}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </a>
              ))}
            </div>
            <div className="footerSocialGrid" aria-label={t('footer.socialTitle')}>
              {footerSocialHandles.map((social) => (
                <a className="footerSocialLink" href={social.href} key={social.network} target="_blank" rel="noreferrer">
                  <span className="footerSocialBadge">{social.badge}</span>
                  <span className="footerSocialText">
                    <strong>{social.network}</strong>
                    <small>{social.handle}</small>
                  </span>
                </a>
              ))}
            </div>
            <button
              className="footerLanguageSelect"
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              aria-label={t('nav.switchLanguage')}
            >
              <Globe size={20} />
              <span>{language === 'en' ? 'English' : 'Urdu'}</span>
              <ChevronDown size={20} />
            </button>
            <div className="footerLegalLine" id="footer-legal">
              <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
              <a href="#footer-privacy">{t('footer.legalLink')}</a>
              <a href="#footer-sitemap">{t('footer.sitemapLink')}</a>
            </div>
          </section>

          <nav className="footerColumnGrid" aria-label={t('footer.essentialsTitle')} id="footer-sitemap">
            {footerColumns.map((column) => (
              <section className="footerColumn" key={column.title}>
                <h2>{column.title}</h2>
                <div className="footerLinkList">
                  {column.links.map((link) =>
                    link.to ? (
                      <Link key={link.label} to={link.to}>
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        key={link.label}
                        rel={link.external ? 'noreferrer' : undefined}
                        target={link.external ? '_blank' : undefined}
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </div>
              </section>
            ))}
          </nav>

          <div className="footerFinePrint">
            <p id="footer-privacy">
              <strong>{t('footer.policyTitle')}</strong>
              {t('footer.policyText')}
            </p>
            <p id="footer-hours">
              <strong>{t('footer.hoursTitle')}</strong>
              {t('footer.hours')} - {t('footer.serviceArea')}
            </p>
            <p id="footer-faqs">
              <strong>{t('footer.faqTitle')}</strong>
              {t('footer.faqSummary')}
            </p>
          </div>
        </div>
      </footer>

      {zoomImage && <ImageZoomDialog image={zoomImage} onClose={() => setZoomImage(null)} />}
      </div>
    </I18nProvider>
  )
}

export default App
