import { useState, useEffect, useCallback } from 'react';
import { FiArrowLeft, FiCheck, FiLock, FiShield, FiX, FiAlertCircle } from 'react-icons/fi';
import { formatPrice } from '../utils/format';
import './NetBankingFlow.css';

/* ============================================================
   BACKEND INTEGRATION POINTS
   ============================================================
   All backend API calls are centralized below. Replace each
   stub with your real API call when the backend is ready.
   Every function returns a Promise so the UI flow stays the same.
   ============================================================ */
const netBankingAPI = {

  /**
   * Step 1 – Initiate the net banking session.
   * Called when user clicks "Pay" and selects net banking.
   * Should create a payment session on your server and return
   * a session/transaction ID.
   *
   * @param {Object}  params
   * @param {string}  params.bankCode     – e.g. "sbi", "hdfc"
   * @param {number}  params.amount       – total amount in INR
   * @param {string}  params.orderId      – your internal order ID
   * @param {Object}  params.customerInfo – { name, email, phone }
   * @returns {Promise<{ sessionId: string, redirectUrl?: string }>}
   */
  initiateSession: async (/* { bankCode, amount, orderId, customerInfo } */) => {
    // TODO: POST /api/payments/netbanking/initiate
    // The backend should create a payment record in "pending" state
    // and return a sessionId (and optionally a real bank redirect URL).
    return { sessionId: `SIM-${Date.now()}` };
  },

  /**
   * Step 2 – Authenticate user credentials with the bank.
   * In production this would be handled by the bank's own page
   * or a payment gateway SDK (Razorpay / Cashfree / PayU).
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.userId
   * @param {string} params.password
   * @returns {Promise<{ success: boolean, requiresOtp: boolean, maskedPhone?: string }>}
   */
  authenticateUser: async (/* { sessionId, userId, password } */) => {
    // TODO: POST /api/payments/netbanking/authenticate
    // Validate credentials with bank gateway, return OTP requirement.
    return { success: true, requiresOtp: true, maskedPhone: '******7890' };
  },

  /**
   * Step 3 – Verify the OTP / 2FA code.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.otp
   * @returns {Promise<{ verified: boolean }>}
   */
  verifyOtp: async (/* { sessionId, otp } */) => {
    // TODO: POST /api/payments/netbanking/verify-otp
    return { verified: true };
  },

  /**
   * Step 4 – Confirm & process the payment after user reviews.
   * This is where the actual money transfer happens.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {boolean} params.confirmed
   * @returns {Promise<{ status: 'success'|'failed', transactionId?: string, reason?: string }>}
   */
  confirmPayment: async (/* { sessionId, confirmed } */) => {
    // TODO: POST /api/payments/netbanking/confirm
    // The backend processes the payment via the bank gateway,
    // updates the payment record status, and returns the result.
    return {
      status: 'success',
      transactionId: `TXN${Date.now().toString().slice(-8)}`
    };
  },

  /**
   * Step 5 – Resend OTP if user requests it.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @returns {Promise<{ sent: boolean, maskedPhone?: string }>}
   */
  resendOtp: async (/* { sessionId } */) => {
    // TODO: POST /api/payments/netbanking/resend-otp
    return { sent: true, maskedPhone: '******7890' };
  },
};


/* ============================================================
   BANK METADATA
   ============================================================ */
const BANK_INFO = {
  sbi:   { name: 'State Bank of India',  color: '#1a4c8e', logo: '🏦' },
  hdfc:  { name: 'HDFC Bank',            color: '#004c8f', logo: '🏦' },
  icici: { name: 'ICICI Bank',           color: '#f58220', logo: '🏦' },
  axis:  { name: 'Axis Bank',            color: '#97144d', logo: '🏦' },
  kotak: { name: 'Kotak Mahindra Bank',  color: '#ed1c24', logo: '🏦' },
  bob:   { name: 'Bank of Baroda',       color: '#f47920', logo: '🏦' },
  pnb:   { name: 'Punjab National Bank', color: '#1b3a6b', logo: '🏦' },
  canara:{ name: 'Canara Bank',          color: '#fdc82f', logo: '🏦' },
};

/* ============================================================
   STEPS
   ============================================================ */
const STEPS = {
  REDIRECTING: 'redirecting',
  LOGIN: 'login',
  OTP: 'otp',
  REVIEW: 'review',
  PROCESSING: 'processing',
  RESULT: 'result',
};

const STEP_LABELS = [
  { key: STEPS.LOGIN,   label: 'Login' },
  { key: STEPS.OTP,     label: 'Verify' },
  { key: STEPS.REVIEW,  label: 'Review' },
  { key: STEPS.RESULT,  label: 'Result' },
];

const stepIndex = (step) => STEP_LABELS.findIndex(s => s.key === step);

/* ============================================================
   COMPONENT
   ============================================================ */
const NetBankingFlow = ({
  bankCode,
  amount,
  orderId,
  cartItems = [],
  deliveryFee = 0,
  handlingCharge = 0,
  customerInfo = {},
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [step, setStep] = useState(STEPS.REDIRECTING);
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // 'success' | 'failed'
  const [otpResent, setOtpResent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);

  const bank = BANK_INFO[bankCode] || { name: bankCode, color: '#1a4c8e', logo: '🏦' };

  /* ---------- Step 0: Simulated redirect / session init ---------- */
  useEffect(() => {
    if (step !== STEPS.REDIRECTING) return;

    const timer = setTimeout(async () => {
      try {
        // ── BACKEND INTEGRATION POINT ──
        const result = await netBankingAPI.initiateSession({
          bankCode, amount, orderId, customerInfo,
        });
        setSessionId(result.sessionId);
        setStep(STEPS.LOGIN);
      } catch {
        setError('Unable to connect to bank. Please try again.');
        setStep(STEPS.RESULT);
        setPaymentStatus('failed');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [step, bankCode, amount, orderId, customerInfo]);

  /* ---------- OTP countdown timer ---------- */
  useEffect(() => {
    if (step !== STEPS.OTP || otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, otpTimer]);

  /* ---------- Handlers ---------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Please enter both User ID and Password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // ── BACKEND INTEGRATION POINT ──
      const result = await netBankingAPI.authenticateUser({
        sessionId, userId, password,
      });
      if (result.success) {
        if (result.requiresOtp) {
          setMaskedPhone(result.maskedPhone || '******xxxx');
          setOtpTimer(30);
          setStep(STEPS.OTP);
        } else {
          setStep(STEPS.REVIEW);
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = useCallback((index, value) => {
    if (value.length > 1) return;
    setOtp(prev => {
      const next = [...prev];
      next[index] = value.replace(/\D/g, '');
      return next;
    });
    setError('');
    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`nb-otp-${index + 1}`);
      nextInput?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`nb-otp-${index - 1}`);
      prevInput?.focus();
    }
  }, [otp]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // ── BACKEND INTEGRATION POINT ──
      const result = await netBankingAPI.verifyOtp({ sessionId, otp: otpCode });
      if (result.verified) {
        setStep(STEPS.REVIEW);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch {
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      // ── BACKEND INTEGRATION POINT ──
      const result = await netBankingAPI.resendOtp({ sessionId });
      if (result.sent) {
        setOtp(['', '', '', '', '', '']);
        setOtpTimer(30);
        setOtpResent(true);
        setError('');
        setTimeout(() => setOtpResent(false), 3000);
      }
    } catch {
      setError('Failed to resend OTP.');
    }
  };

  const handleConfirmPayment = async () => {
    setStep(STEPS.PROCESSING);
    try {
      // ── BACKEND INTEGRATION POINT ──
      const result = await netBankingAPI.confirmPayment({
        sessionId, confirmed: true,
      });
      // Simulate processing delay for UI feel
      await new Promise(resolve => setTimeout(resolve, 2500));

      setPaymentStatus(result.status);
      setTransactionId(result.transactionId || '');
      setStep(STEPS.RESULT);
    } catch {
      setPaymentStatus('failed');
      setStep(STEPS.RESULT);
    }
  };

  const handleResultAction = () => {
    if (paymentStatus === 'success') {
      onSuccess?.({ transactionId, sessionId, bankCode, method: 'netbanking' });
    } else {
      onFailure?.({ sessionId, bankCode, method: 'netbanking' });
    }
  };

  /* ---------- Step indicator ---------- */
  const currentStepIdx = stepIndex(step);
  const renderStepIndicator = () => {
    if (step === STEPS.REDIRECTING || step === STEPS.PROCESSING) return null;
    return (
      <div className="nb__steps">
        {STEP_LABELS.map((s, i) => (
          <div
            key={s.key}
            className={`nb__step-dot ${i <= currentStepIdx ? 'nb__step-dot--active' : ''} ${i < currentStepIdx ? 'nb__step-dot--done' : ''}`}
          >
            <span className="nb__step-num">
              {i < currentStepIdx ? <FiCheck /> : i + 1}
            </span>
            <span className="nb__step-label">{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  /* ---------- Render Screens ---------- */

  // Redirecting screen
  const renderRedirecting = () => (
    <div className="nb__redirecting">
      <div className="nb__redirect-spinner" />
      <h3 className="nb__redirect-title">Redirecting to {bank.name}</h3>
      <p className="nb__redirect-sub">Please wait while we connect you to your bank&apos;s secure portal…</p>
      <div className="nb__redirect-secure">
        <FiLock /> 256-bit SSL Encrypted
      </div>
    </div>
  );

  // Login screen
  const renderLogin = () => (
    <form className="nb__login" onSubmit={handleLogin}>
      <div className="nb__bank-header" style={{ borderColor: bank.color }}>
        <span className="nb__bank-logo">{bank.logo}</span>
        <div>
          <h3 className="nb__bank-name">{bank.name}</h3>
          <p className="nb__bank-sub">Net Banking Login</p>
        </div>
      </div>

      <div className="nb__field">
        <label className="nb__label" htmlFor="nb-userid">User ID / Customer ID</label>
        <input
          id="nb-userid"
          type="text"
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setError(''); }}
          className="nb__input"
          placeholder="Enter your User ID"
          autoFocus
          autoComplete="username"
        />
      </div>

      <div className="nb__field">
        <label className="nb__label" htmlFor="nb-password">Password</label>
        <div className="nb__password-wrap">
          <input
            id="nb-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            className="nb__input"
            placeholder="Enter your Password"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="nb__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error && <p className="nb__error"><FiAlertCircle /> {error}</p>}

      <button type="submit" className="nb__btn nb__btn--primary" disabled={loading}>
        {loading ? <span className="nb__btn-spinner" /> : null}
        {loading ? 'Authenticating...' : 'Login Securely'}
      </button>

      <div className="nb__secure-badge">
        <FiShield /> Your credentials are encrypted and sent directly to your bank
      </div>
    </form>
  );

  // OTP screen
  const renderOtp = () => (
    <form className="nb__otp-screen" onSubmit={handleVerifyOtp}>
      <div className="nb__otp-header">
        <FiShield className="nb__otp-icon" />
        <h3 className="nb__otp-title">Two-Factor Authentication</h3>
        <p className="nb__otp-sub">
          Enter the 6-digit OTP sent to your registered mobile number {maskedPhone}
        </p>
      </div>

      <div className="nb__otp-inputs">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`nb-otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className="nb__otp-box"
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <p className="nb__error"><FiAlertCircle /> {error}</p>}
      {otpResent && <p className="nb__otp-resent">✓ OTP resent successfully!</p>}

      <button type="submit" className="nb__btn nb__btn--primary" disabled={loading}>
        {loading ? <span className="nb__btn-spinner" /> : null}
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="nb__otp-footer">
        {otpTimer > 0 ? (
          <span className="nb__otp-timer">Resend OTP in {otpTimer}s</span>
        ) : (
          <button type="button" className="nb__otp-resend" onClick={handleResendOtp}>
            Resend OTP
          </button>
        )}
      </div>
    </form>
  );

  // Review screen
  const renderReview = () => {
    const itemTotal = amount - deliveryFee - handlingCharge;
    return (
      <div className="nb__review">
        <h3 className="nb__review-title">Review Payment</h3>
        <p className="nb__review-sub">Please review the details before confirming your payment</p>

        <div className="nb__review-card">
          <div className="nb__review-section">
            <h4 className="nb__review-section-title">Payment Details</h4>
            <div className="nb__review-row">
              <span>Merchant</span><span>Siri Traders</span>
            </div>
            <div className="nb__review-row">
              <span>Order ID</span><span>{orderId}</span>
            </div>
            <div className="nb__review-row">
              <span>Bank</span><span>{bank.name}</span>
            </div>
            <div className="nb__review-row">
              <span>Payment Method</span><span>Net Banking</span>
            </div>
          </div>

          <div className="nb__review-divider" />

          <div className="nb__review-section">
            <h4 className="nb__review-section-title">Order Summary</h4>
            {cartItems.slice(0, 5).map((item, i) => (
              <div key={i} className="nb__review-row nb__review-row--item">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            {cartItems.length > 5 && (
              <div className="nb__review-row nb__review-row--item">
                <span>+ {cartItems.length - 5} more items</span>
              </div>
            )}
          </div>

          <div className="nb__review-divider" />

          <div className="nb__review-section">
            <div className="nb__review-row">
              <span>Item Total</span><span>{formatPrice(itemTotal)}</span>
            </div>
            <div className="nb__review-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="nb__review-row">
              <span>Handling Charge</span><span>{formatPrice(handlingCharge)}</span>
            </div>
            <div className="nb__review-row nb__review-row--total">
              <span>Total Amount</span><span>{formatPrice(amount)}</span>
            </div>
          </div>
        </div>

        <button className="nb__btn nb__btn--primary" onClick={handleConfirmPayment}>
          Confirm & Pay {formatPrice(amount)}
        </button>

        <p className="nb__review-disclaimer">
          <FiLock /> By confirming, you authorize {bank.name} to debit {formatPrice(amount)} from your account.
        </p>
      </div>
    );
  };

  // Processing screen
  const renderProcessing = () => (
    <div className="nb__processing">
      <div className="nb__processing-animation">
        <div className="nb__processing-ring" />
        <FiLock className="nb__processing-lock" />
      </div>
      <h3 className="nb__processing-title">Processing Payment</h3>
      <p className="nb__processing-sub">
        Please do not close this window or press the back button.
        <br />Your transaction is being processed securely.
      </p>
      <div className="nb__processing-steps">
        <div className="nb__processing-step nb__processing-step--done">
          <FiCheck /> Credentials verified
        </div>
        <div className="nb__processing-step nb__processing-step--done">
          <FiCheck /> OTP validated
        </div>
        <div className="nb__processing-step nb__processing-step--active">
          <span className="nb__mini-spinner" /> Processing transaction…
        </div>
      </div>
    </div>
  );

  // Result screen
  const renderResult = () => {
    const isSuccess = paymentStatus === 'success';
    return (
      <div className="nb__result">
        <div className={`nb__result-icon ${isSuccess ? 'nb__result-icon--success' : 'nb__result-icon--fail'}`}>
          {isSuccess ? <FiCheck /> : <FiX />}
        </div>

        <h3 className={`nb__result-title ${isSuccess ? '' : 'nb__result-title--fail'}`}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h3>

        <p className="nb__result-sub">
          {isSuccess
            ? 'Your payment has been processed successfully.'
            : 'The transaction could not be completed. No money has been debited from your account.'
          }
        </p>

        {isSuccess && (
          <div className="nb__result-details">
            <div className="nb__result-row">
              <span>Transaction ID</span><span>{transactionId}</span>
            </div>
            <div className="nb__result-row">
              <span>Amount Paid</span><span>{formatPrice(amount)}</span>
            </div>
            <div className="nb__result-row">
              <span>Bank</span><span>{bank.name}</span>
            </div>
            <div className="nb__result-row">
              <span>Order ID</span><span>{orderId}</span>
            </div>
            <div className="nb__result-row">
              <span>Date & Time</span>
              <span>{new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
          </div>
        )}

        <button
          className={`nb__btn ${isSuccess ? 'nb__btn--primary' : 'nb__btn--danger'}`}
          onClick={handleResultAction}
        >
          {isSuccess ? 'Continue to Order Confirmation →' : 'Try Again'}
        </button>

        {!isSuccess && (
          <button className="nb__btn nb__btn--ghost" onClick={onCancel}>
            Choose a Different Payment Method
          </button>
        )}
      </div>
    );
  };

  /* ---------- Main render ---------- */
  return (
    <div className="nb__overlay">
      <div className="nb__modal">
        {/* Header */}
        <div className="nb__header">
          {step !== STEPS.REDIRECTING && step !== STEPS.PROCESSING && step !== STEPS.RESULT && (
            <button className="nb__header-back" onClick={() => {
              if (step === STEPS.LOGIN) onCancel?.();
              else if (step === STEPS.OTP) setStep(STEPS.LOGIN);
              else if (step === STEPS.REVIEW) setStep(STEPS.OTP);
            }}>
              <FiArrowLeft />
            </button>
          )}
          <div className="nb__header-info">
            <span className="nb__header-title">{bank.name} Net Banking</span>
            <span className="nb__header-secure"><FiLock /> Secure Payment</span>
          </div>
          {step !== STEPS.PROCESSING && (
            <button className="nb__header-close" onClick={onCancel}>
              <FiX />
            </button>
          )}
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <div className="nb__content">
          {step === STEPS.REDIRECTING && renderRedirecting()}
          {step === STEPS.LOGIN && renderLogin()}
          {step === STEPS.OTP && renderOtp()}
          {step === STEPS.REVIEW && renderReview()}
          {step === STEPS.PROCESSING && renderProcessing()}
          {step === STEPS.RESULT && renderResult()}
        </div>
      </div>
    </div>
  );
};

export default NetBankingFlow;
