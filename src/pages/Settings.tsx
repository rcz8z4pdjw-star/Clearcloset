import { useState } from 'react';
import { useApp } from '../store/context';
import { SubscriptionTier } from '../types';
import {
  User,
  Crown,
  Check,
  ChevronRight,
  Download,
  Trash2,
  HelpCircle,
  Star,
  Zap,
} from 'lucide-react';

export function Settings() {
  const { state, actions } = useApp();
  const [showSubscription, setShowSubscription] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'closetclear-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      localStorage.removeItem('closetclear_data');
      window.location.reload();
    }
  };

  const plans: {
    tier: SubscriptionTier;
    name: string;
    price: string;
    features: string[];
    popular?: boolean;
  }[] = [
    {
      tier: 'free',
      name: 'Free',
      price: '$0',
      features: [
        'Up to 50 items',
        'Basic wear tracking',
        'Simple analytics',
        'Manual outfit creation',
      ],
    },
    {
      tier: 'basic',
      name: 'Basic',
      price: '$9/mo',
      features: [
        'Unlimited items',
        'Full wear tracking',
        'Detailed analytics',
        'AI outfit suggestions',
        'Shareable stats',
        'Packing lists',
      ],
      popular: true,
    },
    {
      tier: 'premium',
      name: 'Premium',
      price: '$19/mo',
      features: [
        'Everything in Basic',
        'Resale marketplace integration',
        'Auto-generated listings',
        'Advanced style algorithms',
        'Priority support',
        'Early access to features',
      ],
    },
  ];

  if (showSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Choose Plan</h1>
          <button
            onClick={() => setShowSubscription(false)}
            className="text-primary-600 text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <button
              key={plan.tier}
              onClick={() => {
                actions.updateSubscription(plan.tier);
                setShowSubscription(false);
              }}
              className={`w-full text-left rounded-xl p-4 border-2 transition-colors ${
                state.user?.subscription === plan.tier
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-200'
              } ${plan.popular ? 'relative' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {plan.tier === 'premium' && (
                    <Crown className="w-5 h-5 text-amber-500" />
                  )}
                  {plan.tier === 'basic' && (
                    <Zap className="w-5 h-5 text-primary-500" />
                  )}
                  <span className="font-semibold text-gray-900">{plan.name}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{plan.price}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {state.user?.subscription === plan.tier && (
                <div className="mt-3 text-center text-sm font-medium text-primary-600">
                  Current Plan
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Cancel anytime. No questions asked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{state.user?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">{state.user?.email || 'No email set'}</p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <button
        onClick={() => setShowSubscription(true)}
        className="w-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-4 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <div className="text-left">
              <p className="font-semibold">
                {state.user?.subscription === 'free'
                  ? 'Upgrade to Premium'
                  : state.user?.subscription === 'basic'
                  ? 'Basic Plan'
                  : 'Premium Plan'}
              </p>
              <p className="text-sm text-white/80">
                {state.user?.subscription === 'free'
                  ? 'Unlock all features'
                  : 'Manage subscription'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Your Wardrobe</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{state.items.length}</p>
            <p className="text-xs text-gray-500">Items</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{state.outfits.length}</p>
            <p className="text-xs text-gray-500">Outfits</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{state.wearLogs.length}</p>
            <p className="text-xs text-gray-500">Wears</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">Export Data</span>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
        <div className="border-t border-gray-100" />
        <button
          onClick={handleClearData}
          className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
          <span className="text-red-600">Delete All Data</span>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
      </div>

      {/* Help */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">Help & Support</span>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
        <div className="border-t border-gray-100" />
        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
          <Star className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">Rate ClosetClear</span>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        ClosetClear v1.0.0
      </p>
    </div>
  );
}
