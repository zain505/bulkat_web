import { ChevronDown, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../useI18n'
import './Footer.css'

const footerPagePaths = {
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

function FooterLink({ link }) {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>
  }

  return (
    <a href={link.href} rel={link.external ? 'noreferrer' : undefined} target={link.external ? '_blank' : undefined}>
      {link.label}
    </a>
  )
}

function Footer({ language = 'en', onLanguageChange }) {
  const { t } = useI18n()
  const nextLanguage = language === 'en' ? 'ur' : 'en'
  const currentLanguageLabel = language === 'en' ? 'English' : 'Urdu'
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
    t('footer.faqRefundQuestion'),
    t('footer.faqDeliveryQuestion'),
    t('footer.faqBulkQuestion'),
    t('footer.faqSupportQuestion'),
  ]
  const footerColumns = [
    {
      title: t('footer.columnShop'),
      links: [
        { label: t('footer.shopLink'), to: footerPagePaths.shop },
        { label: t('footer.bulkDealsLink'), to: footerPagePaths.shop },
        { label: t('footer.cartLink'), to: footerPagePaths.cart },
        { label: t('footer.checkoutLink'), to: footerPagePaths.checkout },
        { label: t('footer.ordersLink'), to: footerPagePaths.orders },
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
        { label: t('footer.privacyLink'), href: 'mailto:support@bulkat.pk?subject=Privacy%20Policy' },
        { label: t('footer.legalLink'), href: '#footer-legal' },
        { label: t('footer.sitemapLink'), href: '#footer-sitemap' },
        { label: t('footer.hours'), href: 'tel:+923001112855' },
      ],
    },
    {
      title: t('footer.columnFaqs'),
      links: footerFaqs.map((question) => ({
        label: question,
        href: `mailto:support@bulkat.pk?subject=${encodeURIComponent(question)}`,
      })),
    },
  ]

  return (
    <footer className="siteFooter" aria-label={t('footer.label')}>
      <div className="siteFooterInner">
        <section className="footerBrandPanel">
          <Link className="footerWordmark" to={footerPagePaths.shop} aria-label={t('brand')}>
            <span className="footerBrandMark" aria-hidden="true">
              {['B', 'U', 'L', 'K', 'A', 'T'].map((letter, index) => (
                <span className="footerBrandLetter" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
              <span className="footerBrandEye footerBrandEyeLeft" />
              <span className="footerBrandEye footerBrandEyeRight" />
              <span className="footerBrandDot" />
            </span>
            <span className="footerWordmarkCopy">
              <strong>{t('brand')}</strong>
              <small>{t('footer.brandMeta')}</small>
            </span>
          </Link>
          <p className="footerTagline">{t('footer.tagline')}</p>
          <div className="footerSocialGrid" aria-label={t('footer.socialTitle')}>
            {footerSocialHandles.slice(0, 5).map((social) => (
              <a
                aria-label={`${social.network}: ${social.handle}`}
                className={`footerSocialLink footerSocialLink${social.badge}`}
                href={social.href}
                key={social.network}
                target="_blank"
                rel="noreferrer"
              >
                <span className="footerSocialGlyph" aria-hidden="true" />
              </a>
            ))}
          </div>
          <button
            className="footerLanguageSelect"
            type="button"
            onClick={() => onLanguageChange?.(nextLanguage)}
            aria-label={t('nav.switchLanguage')}
          >
            <Globe size={20} />
            <span>{currentLanguageLabel}</span>
            <ChevronDown size={20} />
          </button>
          <div className="footerLegalLine" id="footer-legal">
            <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
            <a href="#footer-legal">{t('footer.legalLink')}</a>
            <a href="#footer-sitemap">{t('footer.sitemapLink')}</a>
          </div>
        </section>

        <nav className="footerColumnGrid" aria-label={t('footer.essentialsTitle')} id="footer-sitemap">
          {footerColumns.map((column) => (
            <section className="footerColumn" key={column.title}>
              <h2>{column.title}</h2>
              <div className="footerLinkList">
                {column.links.map((link) => (
                  <FooterLink key={link.label} link={link} />
                ))}
              </div>
            </section>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer
