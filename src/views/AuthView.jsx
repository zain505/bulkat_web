import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  KeyRound,
  MailCheck,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  UserPlus,
} from 'lucide-react'
import logo from '../assets/logo.png'
import { emptyLogin, emptySignup } from '../data/formDefaults'
import { useI18n } from '../useI18n'
import { errorMessage } from '../utils/commerce'

const modeDetails = {
  login: {
    kicker: 'Secure sign in',
    title: 'Welcome back to Bulkat',
    text: 'Access your cart, order history, and customer tools from one protected account.',
    proof: 'Protected commerce workspace',
    Icon: KeyRound,
  },
  signup: {
    kicker: 'Create account',
    title: 'Start buying smarter',
    text: 'Build a verified Bulkat profile for faster checkout and reliable order tracking.',
    proof: 'Email verification included',
    Icon: UserPlus,
  },
  otp: {
    kicker: 'Email verification',
    title: 'Confirm your email',
    text: 'Enter the code sent to your inbox to unlock your account and continue securely.',
    proof: 'Six digit verification',
    Icon: ShieldCheck,
  },
}

const formNotes = {
  login: 'Use your email or mobile number to continue.',
  signup: 'Create a verified profile once, then check out faster every time.',
  otp: 'Keep this code private while we verify the email on your account.',
}

function AuthView({ authMode, setAuthMode, apiRequest, onAuthenticated }) {
  const { t } = useI18n()
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [signupForm, setSignupForm] = useState(emptySignup)
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequired, setOtpRequired] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authMode === 'otp' && !otpRequired) {
      setAuthMode('login')
    }
  }, [authMode, otpRequired, setAuthMode])

  const openOtpVerification = (email) => {
    setOtpEmail(email)
    setOtpRequired(true)
    setAuthMode('otp')
  }

  const openAuthMode = (nextMode) => {
    setOtpRequired(false)
    setOtp('')
    setAuthMode(nextMode)
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('post', '/auth/login', loginForm)
      onAuthenticated({ token: data.token, user: data.user })
    } catch (error) {
      setMessage(errorMessage(error))
      if (error?.response?.data?.code === 'ACCOUNT_OTP_PENDING') {
        openOtpVerification(error.response.data.details?.email || loginForm.emailOrMobile)
      }
    } finally {
      setLoading(false)
    }
  }

  const submitSignup = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('post', '/auth/signup', signupForm)
      openOtpVerification(signupForm.email)
      setMessage(data.devOtp ? t('auth.otpSentDev', { otp: data.devOtp }) : t('auth.otpSent'))
    } catch (error) {
      setMessage(errorMessage(error))
      if (error?.response?.data?.code === 'ACCOUNT_OTP_PENDING') {
        openOtpVerification(error.response.data.details?.email || signupForm.email)
      }
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('post', '/auth/verify-otp', {
        email: otpEmail,
        otp,
      })
      onAuthenticated({ token: data.token, user: data.user })
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('post', '/auth/resend-otp', { email: otpEmail })
      setMessage(data.devOtp ? t('auth.newOtpSentDev', { otp: data.devOtp }) : t('auth.newOtpSent'))
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const visibleMode = authMode === 'otp' && otpRequired ? 'otp' : authMode === 'signup' ? 'signup' : 'login'
  const activeDetails = modeDetails[visibleMode] || modeDetails.login
  const ActiveIcon = activeDetails.Icon

  return (
    <section className={`authShell authShell-${visibleMode}`}>
      <div className="authHeroPanel">
        <div className="authBrandLockup">
          <img src={logo} alt="" className="authLogoMark" />
          <div>
            <span>{t('brand')}</span>
            <strong>{activeDetails.proof}</strong>
          </div>
        </div>

        <div className="authHeroCopy">
          {activeDetails.kicker && <span className="authKicker">{activeDetails.kicker}</span>}
          <h1>{activeDetails.title}</h1>
          {activeDetails.text && <p>{activeDetails.text}</p>}
        </div>

        <div className="authVisualStage" aria-hidden="true">
          <div className="authVisualLogo">
            <img src={logo} alt="" />
          </div>
          <div className="authVisualCard authVisualCardOne">
            <ShieldCheck size={18} />
            <span>
              <strong>Verified</strong>
              <small>Protected account</small>
            </span>
          </div>
          <div className="authVisualCard authVisualCardTwo">
            <ShoppingCart size={18} />
            <span>
              <strong>Cart synced</strong>
              <small>Ready at checkout</small>
            </span>
          </div>
          <div className="authVisualCard authVisualCardThree">
            <Truck size={18} />
            <span>
              <strong>Orders live</strong>
              <small>Track in profile</small>
            </span>
          </div>
          <div className="authVisualRail">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="authPanel">
        <div className="authPanelHeader">
          <span className="authPanelIcon">
            <ActiveIcon size={22} />
          </span>
          <div>
            {activeDetails.kicker && <span className="authKicker">{activeDetails.kicker}</span>}
            <h2>{activeDetails.title}</h2>
            {activeDetails.text && <p>{activeDetails.text}</p>}
          </div>
        </div>

        <div className="authPanelMeta">
          <ShieldCheck size={16} />
          <span>{formNotes[visibleMode]}</span>
        </div>

        {message && (
          <div className="formMessage authMessage" role="status" aria-live="polite">
            <MailCheck size={18} />
            <span>{message}</span>
          </div>
        )}

        {visibleMode === 'login' && (
          <form className="panelForm authForm" onSubmit={submitLogin}>
            <label className="authField">
              <span className="authLabel">{t('auth.emailOrMobile')}</span>
              <span className="authInputWrap">
                <User size={18} />
                <input
                  autoComplete="username"
                  value={loginForm.emailOrMobile}
                  onChange={(event) => setLoginForm({ ...loginForm, emailOrMobile: event.target.value })}
                  required
                />
              </span>
            </label>
            <label className="authField">
              <span className="authLabel">{t('auth.password')}</span>
              <span className="authInputWrap">
                <KeyRound size={18} />
                <input
                  autoComplete="current-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  required
                />
              </span>
            </label>
            <button className="primaryButton authPrimaryAction" type="submit" disabled={loading}>
              <KeyRound size={18} />
              <span>{t('auth.login')}</span>
            </button>
          </form>
        )}

        {visibleMode === 'signup' && (
          <form className="panelForm authForm" onSubmit={submitSignup}>
            <div className="twoColumns authTwoColumns">
              <label className="authField">
                <span className="authLabel">{t('auth.name')}</span>
                <span className="authInputWrap">
                  <User size={18} />
                  <input
                    autoComplete="name"
                    value={signupForm.name}
                    onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
                    required
                  />
                </span>
              </label>
              <label className="authField">
                <span className="authLabel">{t('auth.mobile')}</span>
                <span className="authInputWrap">
                  <Phone size={18} />
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    value={signupForm.mobile}
                    onChange={(event) => setSignupForm({ ...signupForm, mobile: event.target.value })}
                    required
                  />
                </span>
              </label>
            </div>
            <label className="authField">
              <span className="authLabel">{t('auth.email')}</span>
              <span className="authInputWrap">
                <MailCheck size={18} />
                <input
                  autoComplete="email"
                  type="email"
                  value={signupForm.email}
                  onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                  required
                />
              </span>
            </label>
            <div className="twoColumns authTwoColumns">
              <label className="authField">
                <span className="authLabel">{t('auth.password')}</span>
                <span className="authInputWrap">
                  <KeyRound size={18} />
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                    required
                  />
                </span>
              </label>
              <label className="authField">
                <span className="authLabel">{t('auth.confirmPassword')}</span>
                <span className="authInputWrap">
                  <CheckCircle2 size={18} />
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(event) => setSignupForm({ ...signupForm, confirmPassword: event.target.value })}
                    required
                  />
                </span>
              </label>
            </div>
            <button className="primaryButton authPrimaryAction" type="submit" disabled={loading}>
              <MailCheck size={18} />
              <span>{t('auth.createAccount')}</span>
            </button>
          </form>
        )}

        {visibleMode === 'otp' && (
          <form className="panelForm authForm" onSubmit={submitOtp}>
            <label className="authField">
              <span className="authLabel">{t('auth.email')}</span>
              <span className="authInputWrap">
                <MailCheck size={18} />
                <input
                  autoComplete="email"
                  type="email"
                  value={otpEmail}
                  onChange={(event) => setOtpEmail(event.target.value)}
                  required
                />
              </span>
            </label>
            <label className="authField">
              <span className="authLabel">{t('auth.otp')}</span>
              <span className="authInputWrap authOtpWrap">
                <ShieldCheck size={18} />
                <input
                  autoComplete="one-time-code"
                  className="authOtpInput"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                />
              </span>
            </label>
            <div className="buttonRow authButtonRow">
              <button className="primaryButton authPrimaryAction" type="submit" disabled={loading}>
                <CheckCircle2 size={18} />
                <span>{t('auth.verify')}</span>
              </button>
              <button className="secondaryButton authSecondaryAction" type="button" onClick={resendOtp} disabled={loading || !otpEmail}>
                <RefreshCw size={18} />
                <span>{t('auth.resend')}</span>
              </button>
            </div>
          </form>
        )}

        <div className="authSwitchLine">
          {visibleMode === 'login' && (
            <>
              <span>New to Bulkat?</span>
              <button type="button" onClick={() => openAuthMode('signup')}>
                {t('auth.createAccount')}
              </button>
            </>
          )}
          {visibleMode === 'signup' && (
            <>
              <span>Already have an account?</span>
              <button type="button" onClick={() => openAuthMode('login')}>
                {t('auth.login')}
              </button>
            </>
          )}
          {visibleMode === 'otp' && (
            <>
              <span>Need to start again?</span>
              <button type="button" onClick={() => openAuthMode('login')}>
                {t('auth.login')}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default AuthView
