import React, { useState } from 'react';
import Input from '../common/Input';
import './PaymentForm.css';

/**
 * Payment Form - Stripe Integration Placeholder
 *
 * TODO: Replace with actual Stripe Elements integration
 * npm install @stripe/stripe-js @stripe/react-stripe-js
 *
 * The actual integration will look like:
 *
 * import { loadStripe } from '@stripe/stripe-js';
 * import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
 *
 * const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
 *
 * <Elements stripe={stripePromise}>
 *   <PaymentForm />
 * </Elements>
 */

const PaymentForm = () => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    zipCode: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format card number
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardData(prev => ({ ...prev, [name]: formatted.slice(0, 19) }));
      return;
    }

    // Format expiry
    if (name === 'expiry') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      setCardData(prev => ({ ...prev, [name]: formatted.slice(0, 5) }));
      return;
    }

    // Format CVC
    if (name === 'cvc') {
      setCardData(prev => ({ ...prev, [name]: value.slice(0, 4) }));
      return;
    }

    // Format Zip
    if (name === 'zipCode') {
      setCardData(prev => ({ ...prev, [name]: value.slice(0, 5) }));
      return;
    }

    setCardData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="payment-form">
      <div className="secure-badge">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a2 2 0 0 0-2 2v4H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H7V3a1 1 0 0 1 2 0v1h2V3a2 2 0 0 0-2-2z"/>
        </svg>
        Secure payment processing
      </div>

      <div className="card-input-wrapper">
        <label className="form-label">Card Number</label>
        <div className="card-input">
          <input
            type="text"
            name="cardNumber"
            value={cardData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className="form-input"
            inputMode="numeric"
          />
          <div className="card-icons">
            <span className="card-icon">💳</span>
          </div>
        </div>
      </div>

      <div className="payment-row">
        <div className="form-group">
          <label className="form-label">Expiration</label>
          <input
            type="text"
            name="expiry"
            value={cardData.expiry}
            onChange={handleChange}
            placeholder="MM/YY"
            className="form-input"
            inputMode="numeric"
          />
        </div>

        <div className="form-group">
          <label className="form-label">CVC</label>
          <input
            type="text"
            name="cvc"
            value={cardData.cvc}
            onChange={handleChange}
            placeholder="123"
            className="form-input"
            inputMode="numeric"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Zip Code</label>
          <input
            type="text"
            name="zipCode"
            value={cardData.zipCode}
            onChange={handleChange}
            placeholder="12345"
            className="form-input"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Stripe Elements will mount here */}
      {/* <div id="card-element"></div> */}

      <p className="payment-disclaimer">
        This is a demo form. In production, this will be replaced with Stripe Elements
        for secure payment processing.
      </p>
    </div>
  );
};

export default PaymentForm;
