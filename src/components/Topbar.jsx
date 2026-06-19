import {
  CreditCard,
  Languages,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { languageMeta } from '../i18nCore'
import { useI18n } from '../useI18n'

function Topbar({ view, cartCount, auth, canAdmin, adminPath = '/admin/catalog', language, onLanguageChange, onLogout }) {
  const { t } = useI18n()
  const navClass = (active) => (active ? 'navButton active' : 'navButton')
  const nextLanguage = language === 'en' ? 'ur' : 'en'

  return (
    <header className="topbar">
      <Link className="brandButton" to="/">
        <img className="brandLogo" src={logo} alt="" />
        <span>{t('brand')}</span>
      </Link>
      <nav className="navGroup" aria-label={t('nav.mainNavigation')}>
        <Link
          aria-current={view === 'shop' || view === 'productDetail' ? 'page' : undefined}
          className={navClass(view === 'shop' || view === 'productDetail')}
          to="/"
        >
          <Tags size={18} />
          <span>{t('nav.shop')}</span>
        </Link>
        <Link aria-current={view === 'cart' ? 'page' : undefined} className={navClass(view === 'cart')} to="/cart">
          <ShoppingCart size={18} />
          <span>{t('nav.cart')}</span>
          {cartCount > 0 && <strong>{cartCount}</strong>}
        </Link>
        <Link
          aria-current={view === 'checkout' ? 'page' : undefined}
          className={navClass(view === 'checkout')}
          to="/checkout"
        >
          <Truck size={18} />
          <span>{t('nav.checkout')}</span>
        </Link>
        {auth.user && (
          <Link
            aria-current={view === 'orders' ? 'page' : undefined}
            className={navClass(view === 'orders')}
            to="/orders"
          >
            <CreditCard size={18} />
            <span>{t('nav.orders')}</span>
          </Link>
        )}
        {canAdmin && (
          <Link
            aria-current={view === 'admin' ? 'page' : undefined}
            className={navClass(view === 'admin')}
            to={adminPath}
          >
            <ShieldCheck size={18} />
            <span>{t('nav.admin')}</span>
          </Link>
        )}
      </nav>
      <div className="accountArea">
        <button
          className="languageToggle"
          type="button"
          onClick={() => onLanguageChange(nextLanguage)}
          title={t('nav.switchLanguage')}
          aria-label={t('nav.switchLanguage')}
        >
          <Languages size={18} />
          <span>{languageMeta[nextLanguage].switchLabel}</span>
        </button>
        {auth.user ? (
          <>
            <span>{auth.user.name}</span>
            <button className="iconButton" type="button" onClick={onLogout} title={t('nav.logout')}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link className="primaryButton" to="/account/login">
            <User size={18} />
            <span>{t('nav.login')}</span>
          </Link>
        )}
      </div>
    </header>
  )
}

export default Topbar
