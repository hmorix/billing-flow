import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, ShieldAlert, ArrowLeft, ArrowUpRight, HelpCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- MAIN BILLING & PLANS COMPONENT ---
export const Billing: React.FC = () => {
  const { apiFetch, organization, updateOrganization } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('checkout_success') === 'true') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [searchParams]);

  const handleSubscribe = async (plan: 'growth' | 'enterprise') => {
    setIsLoading(true);
    setError(null);
    try {
      const returnBase = window.location.origin;
      const response = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          successUrl: `${returnBase}/billing?checkout_success=true`,
          cancelUrl: `${returnBase}/billing?checkout_canceled=true`
        })
      });

      if (response.isMock) {
        // Redirect to our local mock checkout screen
        navigate(response.url);
      } else {
        // Redirect to real Stripe checkout
        window.location.href = response.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize subscription checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/billing/portal', {
        method: 'POST',
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/billing`
        })
      });

      if (response.isMock) {
        navigate(response.url);
      } else {
        window.location.href = response.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = organization?.subscriptionPlan || 'free';
  const currentStatus = organization?.subscriptionStatus || 'none';

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }} className="text-gradient">
          SaaS Billing & Subscriptions
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Select or update your SaaS Invoice & Billing Manager organization plan.
        </p>
      </div>

      {searchParams.get('checkout_success') === 'true' && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--success)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Check size={20} />
          <span>Success! Your subscription has been active. Thank you for subscribing!</span>
        </div>
      )}

      {searchParams.get('checkout_canceled') === 'true' && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--danger)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} />
          <span>Checkout was canceled. No charges were processed.</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--danger)',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Plan Status Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'radial-gradient(circle at 100% 0%, var(--primary-glow) 0%, transparent 60%), var(--glass-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscription Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'capitalize' }}>
              {currentPlan} Tier
            </h3>
            <span className={`badge ${currentStatus === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {currentStatus === 'active' ? 'Active' : 'Unsubscribed'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {currentPlan === 'free' 
              ? 'Upgrade to a paid tier to unlock unlimited invoices and advanced analytics.' 
              : `Your account is active. Next renewal is handled via Stripe billing portal.`}
          </p>
        </div>
        {currentPlan !== 'free' && (
          <button className="btn btn-secondary" onClick={handleManageBilling} disabled={isLoading}>
            <CreditCard size={16} />
            <span>Manage Subscription</span>
          </button>
        )}
      </div>

      {/* Subscription Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Free Plan */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: "center", border: currentPlan === 'free' ? '2px solid var(--border-focus)' : '1px solid var(--border-color)', opacity: currentPlan === 'free' ? 1 : 0.7 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Starter Free</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For tiny teams starting out</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>$0</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ month</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> 3 Clients Maximum</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> 10 Invoices total</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Standard PDF invoices</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Local SQLite repository</li>
            </ul>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '30px' }} 
            disabled 
          >
            {currentPlan === 'free' ? 'Currently Active' : 'Starter Free'}
          </button>
        </div>

        {/* Growth Plan */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', border: currentPlan === 'growth' ? '2px solid var(--border-focus)' : '1px solid var(--border-color)', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Growth Professional</h4>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Popular</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For growing services businesses</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>$49</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ month</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Unlimited Clients</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Unlimited Invoices</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Email payment reminders</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Detailed revenue analytics</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '30px' }} 
            onClick={() => handleSubscribe('growth')}
            disabled={isLoading || currentPlan === 'growth'}
          >
            {currentPlan === 'growth' ? 'Currently Active' : 'Subscribe Growth'}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', border: currentPlan === 'enterprise' ? '2px solid var(--border-focus)' : '1px solid var(--border-color)', opacity: currentPlan === 'enterprise' ? 1 : 0.85 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Enterprise Scale</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For large multi-regional companies</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>$199</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ month</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Everything in Growth</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Custom tax configurations</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> Dedicated account support</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={14} color="var(--success)" /> 99.9% Sandbox SLA</li>
            </ul>
          </div>

          <button 
            className="btn btn-accent" 
            style={{ width: '100%', marginTop: '30px' }} 
            onClick={() => handleSubscribe('enterprise')}
            disabled={isLoading || currentPlan === 'enterprise'}
          >
            {currentPlan === 'enterprise' ? 'Currently Active' : 'Subscribe Enterprise'}
          </button>
        </div>

      </div>

    </div>
  );
};


// --- MOCK CHECKOUT SCREEN ---
export const CheckoutMock: React.FC = () => {
  const { apiFetch, updateOrganization } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = (searchParams.get('plan') || 'growth') as 'growth' | 'enterprise';
  const orgId = searchParams.get('org_id') || '';
  const successUrl = searchParams.get('success_url') || '/billing';
  const cancelUrl = searchParams.get('cancel_url') || '/billing';

  const price = plan === 'growth' ? '$49.00' : '$199.00';

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate latency
    setTimeout(async () => {
      try {
        await apiFetch('/api/billing/mock-checkout-complete', {
          method: 'POST',
          body: JSON.stringify({ plan })
        });
        
        updateOrganization({
          subscriptionPlan: plan,
          subscriptionStatus: 'active'
        });

        // Redirect back to successful page
        window.location.href = successUrl;
      } catch (err) {
        alert('Payment processing failed in mock mode');
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), #0a0b10',
      padding: '24px'
    }}>
      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stripe Sandbox Terminal</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Complete Subscription</h4>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => window.location.href = cancelUrl}>
            Cancel
          </button>
        </div>

        {/* Order Details */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h5 style={{ fontWeight: 600, textTransform: 'capitalize' }}>BillingFlow {plan} Plan</h5>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recurring Monthly Subscription</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{price}</span>
        </div>

        {/* Card details form */}
        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mock Card Number</label>
            <input
              type="text"
              required
              placeholder="4242 4242 4242 4242 (Stripe Test Card)"
              className="form-input"
              defaultValue="4242 4242 4242 4242"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expiry Date</label>
              <input
                type="text"
                required
                placeholder="MM / YY"
                className="form-input"
                defaultValue="12 / 28"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CVC / CVV</label>
              <input
                type="text"
                required
                placeholder="123"
                className="form-input"
                defaultValue="422"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="btn btn-accent"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600, marginTop: '8px' }}
          >
            {isProcessing ? 'Authorizing Payment...' : `Authorize Pay ${price}`}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <CreditCard size={14} />
          <span>Secure simulated sandbox checkout powered by BillingFlow.</span>
        </div>

      </div>
    </div>
  );
};


// --- MOCK CUSTOMER PORTAL SCREEN ---
export const PortalMock: React.FC = () => {
  const { apiFetch, updateOrganization } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const orgId = searchParams.get('org_id') || '';
  const returnUrl = searchParams.get('return_url') || '/billing';

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) return;
    
    setIsProcessing(true);
    try {
      await apiFetch('/api/billing/mock-checkout-complete', {
        method: 'POST',
        body: JSON.stringify({ plan: 'free' })
      });
      
      updateOrganization({
        subscriptionPlan: 'free',
        subscriptionStatus: 'none'
      });

      alert('Subscription canceled successfully.');
      window.location.href = returnUrl;
    } catch (err) {
      alert('Failed to process cancelation.');
      setIsProcessing(false);
    }
  };

  const handleChangeTier = async (newPlan: 'growth' | 'enterprise') => {
    setIsProcessing(true);
    try {
      await apiFetch('/api/billing/mock-checkout-complete', {
        method: 'POST',
        body: JSON.stringify({ plan: newPlan })
      });
      
      updateOrganization({
        subscriptionPlan: newPlan,
        subscriptionStatus: 'active'
      });

      alert(`Tier changed to ${newPlan} successfully.`);
      window.location.href = returnUrl;
    } catch (err) {
      alert('Failed to modify plan tier.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0b10',
      padding: '24px'
    }}>
      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => window.location.href = returnUrl}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stripe Customer Billing Portal</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Manage Subscription Tiers</h4>
          </div>
        </div>

        {/* Payment options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Subscription Actions</h5>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <p style={{ fontWeight: 600 }}>Modify Plan Tier</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Switch between Growth and Enterprise</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => handleChangeTier('growth')}
                disabled={isProcessing}
              >
                Growth
              </button>
              <button 
                className="btn btn-accent" 
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => handleChangeTier('enterprise')}
                disabled={isProcessing}
              >
                Enterprise
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(244, 63, 94, 0.02)',
            border: '1px solid rgba(244, 63, 94, 0.1)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--danger)' }}>Cancel Plan</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Downgrade back to starter free tier</span>
            </div>
            <button 
              className="btn btn-danger" 
              style={{ padding: '8px 12px', fontSize: '0.78rem' }}
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              Cancel Subscription
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
