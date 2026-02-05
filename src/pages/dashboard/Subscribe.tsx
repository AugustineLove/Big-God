import React, { useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Download,
  RefreshCw,
  Shield
} from 'lucide-react';

const SubscribeComponent = () => {
  // Mock user subscription data - replace with actual data from your API
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'Premium',
    status: 'active', // active, expired, cancelled, pending
    amount: 20000,
    currency: 'GHS',
    billingCycle: 'month',
    nextBillingDate: '2025-10-19',
    startDate: '2025-09-19',
    paymentMethod: 'Card ending in 1234',
    subscriptionCode: 'SUB_xyz123456',
    customerCode: 'CUS_abc789012'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return `¢${(amount / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days until next billing
  const getDaysUntilBilling = () => {
    const nextBilling = new Date(subscriptionData.nextBillingDate);
    const today = new Date();
    const diffTime = nextBilling - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle payment retry
  const handleRetryPayment = async () => {
    setIsProcessing(true);
    
    try {
      const handler = window.load({
        key: 'pay_stack_key', 
        email: 'user@example.com',
        amount: subscriptionData.amount * 100,
        currency: subscriptionData.currency,
        metadata: {
          subscription_code: subscriptionData.subscriptionCode,
          customer_code: subscriptionData.customerCode,
          type: 'subscription_retry'
        },
        callback: function(response) {
          console.log('Payment successful:', response);
          alert('Payment successful! Your subscription has been renewed.');
          // Update subscription status
          setSubscriptionData(prev => ({
            ...prev,
            status: 'active',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }));
          setIsProcessing(false);
        },
        onClose: function() {
          setIsProcessing(false);
        }
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error processing payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Here you would make an API call to cancel the subscription
      // const response = await cancelSubscription(subscriptionData.subscriptionCode);
      
      // Mock cancellation
      setTimeout(() => {
        setSubscriptionData(prev => ({
          ...prev,
          status: 'cancelled'
        }));
        alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Error cancelling subscription. Please try again.');
      setIsProcessing(false);
    }
  };

  // Update payment method
  const handleUpdatePaymentMethod = () => {
    const handler = window.PaystackPop.setup({
      key: 'pk_test_your_paystack_public_key',
      email: 'user@example.com',
      amount: 100, // Minimal amount for authorization
      currency: 'GHS',
      metadata: {
        type: 'payment_method_update',
        customer_code: subscriptionData.customerCode
      },
      callback: function(response) {
        console.log('Payment method updated:', response);
        alert('Payment method updated successfully!');
      },
      onClose: function() {
        console.log('Payment method update closed');
      }
    });
    
    handler.openIframe();
  };

  // Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'expired':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your Susu Pro subscription and billing information</p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{subscriptionData.plan} Plan</h2>
              <p className="text-blue-100">Your current subscription</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(subscriptionData.amount)}</div>
              <div className="text-blue-100">per {subscriptionData.billingCycle}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusStyle(subscriptionData.status)}`}>
                {getStatusIcon(subscriptionData.status)}
                <span className="capitalize">{subscriptionData.status}</span>
              </span>
            </div>
            
            {subscriptionData.status === 'active' && (
              <div className="text-sm text-gray-600">
                Next billing in {getDaysUntilBilling()} days
              </div>
            )}
          </div>

          {/* Subscription Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Next Billing Date</div>
                  <div className="font-medium">{formatDate(subscriptionData.nextBillingDate)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Subscription Started</div>
                  <div className="font-medium">{formatDate(subscriptionData.startDate)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Payment Method</div>
                  <div className="font-medium">{subscriptionData.paymentMethod}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* <DollarSign className="w-5 h-5 text-gray-400" /> */}
                <div>
                  <div className="text-sm text-gray-600">Billing Amount</div>
                  <div className="font-medium">{formatCurrency(subscriptionData.amount)} {subscriptionData.currency}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Actions</h3>
          <div className="space-y-3">
            {subscriptionData.status !== 'active' && (
              <button
                onClick={handleRetryPayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Processing...' : 'Retry Payment'}</span>
              </button>
            )}

            <button
              onClick={handleUpdatePaymentMethod}
              className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Update Payment Method</span>
            </button>

            <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </button>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Change Plan</span>
            </button>

            <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>Billing History</span>
            </button>

            {subscriptionData.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Cancelling...' : 'Cancel Subscription'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-900 font-medium">Secure Payment Processing</h4>
            <p className="text-blue-700 text-sm mt-1">
              All payments are processed securely through Paystack. Your payment information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js" />
    </div>
  );
};

export default SubscribeComponent;