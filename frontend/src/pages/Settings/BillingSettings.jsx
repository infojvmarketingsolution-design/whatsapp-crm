import React from 'react';
import { CreditCard, Check, Zap } from 'lucide-react';

export default function BillingSettings() {
  const plans = [
    { name: 'Basic', price: '₹999', period: '/month', features: ['1,000 Contacts', 'Basic CRM', '1 WhatsApp Number', 'Email Support'] },
    { name: 'Pro', price: '₹2,999', period: '/month', active: true, features: ['10,000 Contacts', 'Advanced CRM', '3 WhatsApp Numbers', 'Priority Support', 'Automations'] },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Contacts', 'White-label Domain', 'Unlimited Numbers', 'Dedicated Account Manager'] }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <CreditCard className="mr-2 text-teal-600" size={20} />
          Billing & Subscription Plan
        </h2>

        {/* Current Plan Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-xl p-6 text-white shadow-md mb-8 relative overflow-hidden">
           <div className="absolute right-0 top-0 opacity-10">
              <Zap size={120} className="-mr-4 -mt-4" />
           </div>
           <div className="relative z-10 flex justify-between items-center">
              <div>
                 <span className="text-teal-100 text-xs font-bold uppercase tracking-wider mb-1 block">Current Plan</span>
                 <h3 className="text-3xl font-bold">Pro Tier</h3>
                 <p className="text-teal-100 text-sm mt-1">₹2,999/month. Next billing date: 24 April 2026</p>
              </div>
              <button className="px-4 py-2 bg-white text-teal-700 font-bold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition">
                 Manage Billing
              </button>
           </div>
        </div>

        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {plans.map(plan => (
              <div key={plan.name} className={`relative p-5 rounded-xl border ${plan.active ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50/10' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                 {plan.active && <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">Active</div>}
                 
                 <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
                 <div className="mt-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-500 font-medium">{plan.period}</span>
                 </div>
                 
                 <ul className="space-y-2 mb-6">
                    {plan.features.map(f => (
                       <li key={f} className="flex items-start text-xs text-gray-600 font-medium">
                          <Check size={14} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          {f}
                       </li>
                    ))}
                 </ul>
                 
                 {!plan.active && (
                   <button className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition">
                      Upgrade
                   </button>
                 )}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
