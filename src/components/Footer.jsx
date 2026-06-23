import { Link } from 'react-router-dom'
import { useI18n } from '../useI18n'
import './Footer.css'

const footerPagePaths = {
  shop: '/',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  account: '/account/login',
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

function Footer() {
  const { t } = useI18n()
  const brandName = t('brand').toUpperCase()
  const brandLetters = brandName.split('')
  const footerColumns = [
    {
      title: t('brand').toUpperCase(),
      links: [
        { label: t('footer.shopLink'), to: footerPagePaths.shop },
        { label: t('footer.bulkDealsLink'), to: footerPagePaths.shop },
        { label: t('footer.cartLink'), to: footerPagePaths.cart },
        { label: t('footer.checkoutLink'), to: footerPagePaths.checkout },
      ],
    },
    {
      title: t('footer.columnAbout'),
      links: [
        { label: t('footer.verifiedProductsLink'), to: footerPagePaths.shop },
        { label: t('footer.deliveryCoverageLink'), href: 'mailto:support@bulkat.pk?subject=Delivery%20coverage' },
        { label: t('footer.workingHoursLink'), href: 'tel:+923001112855' },
        { label: t('footer.sitemapLink'), href: '#footer-sitemap' },
      ],
    },
    {
      title: t('footer.columnSupport'),
      links: [
        { label: t('footer.contactUsLink'), href: 'mailto:support@bulkat.pk' },
        { label: t('footer.faqsLink'), href: 'mailto:support@bulkat.pk?subject=FAQs' },
        { label: t('footer.tradeLink'), href: 'https://wa.me/923001112855', external: true },
        { label: t('footer.samplesLink'), href: 'mailto:support@bulkat.pk?subject=Samples%20request' },
      ],
    },
    {
      title: t('footer.columnAccount'),
      links: [
        { label: t('footer.myAccountLink'), to: footerPagePaths.account },
        { label: t('footer.ordersLink'), to: footerPagePaths.orders },
        { label: t('footer.checkoutLink'), to: footerPagePaths.checkout },
        { label: t('footer.giftCardsLink'), href: 'mailto:support@bulkat.pk?subject=Gift%20cards' },
      ],
    },
  ]
  const footerUtilityLinks = [
    { label: t('footer.termsLink'), href: 'mailto:support@bulkat.pk?subject=Terms%20of%20Use' },
    { label: t('footer.privacyLink'), href: 'mailto:support@bulkat.pk?subject=Privacy%20Policy' },
    { label: t('footer.shippingLink'), href: 'mailto:support@bulkat.pk?subject=Shipping%20Policy' },
    { label: t('footer.returnLink'), href: 'mailto:support@bulkat.pk?subject=Return%20Policy' },
  ]

  return (
    <footer className="siteFooter" aria-label={t('footer.label')}>
      <div className="siteFooterContent">
        <section className="footerNewsletter" aria-labelledby="footer-newsletter-title">
          <h2 id="footer-newsletter-title">{t('footer.newsletterTitle')}</h2>
          <form
            className="footerSignupForm"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <label className="footerVisuallyHidden" htmlFor="footer-email">
              {t('footer.newsletterLabel')}
            </label>
            <input id="footer-email" name="email" placeholder={t('footer.newsletterPlaceholder')} type="email" />
            <button type="submit">{t('footer.signupButton')}</button>
          </form>
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

      <div className="footerMetaRow">
        <div className="footerLegalLine" id="footer-legal">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          {footerUtilityLinks.map((link) => (
            <FooterLink key={link.label} link={link} />
          ))}
        </div>

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
      </div>

      <Link className="footerMassiveBrand" to={footerPagePaths.shop} aria-label={t('brand')}>
        {brandLetters.map((letter, index) => (
          <span className="footerBrandLetter" key={`${letter}-${index}`} aria-hidden="true">
            {letter}
          </span>
        ))}
      </Link>
    </footer>
  )
}

export default Footer
