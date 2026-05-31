import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

const PRICING = {
  MARKETING: 0.93,
  UTILITY: 0.16,
  AUTHENTICATION: 0.18
};

function RefillBudgetModal({ isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1000);
  const [category, setCategory] = useState('MARKETING');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  if (!isOpen) return null;

  // Rate constants
  const ratePerMessage = PRICING[category] || 0.93;
  const gstRate = 0.18;
  
  // Calculations
  const qtyNum = parseInt(quantity) || 0;
  const subTotal = qtyNum * ratePerMessage;
  const gstAmount = subTotal * gstRate;
  const totalAmount = subTotal + gstAmount;

  // Static UPI details
  const upiId = '6354070709-3@ybl';
  const payeeName = 'J V MARKETING SOLUTION';
  
  // Dynamic UPI URL
  // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&cu=INR`;

  const handleSubmitVerification = async () => {
     if (!utrNumber || utrNumber.length < 6) {
        setError("Please enter a valid UTR / Reference Number.");
        return;
     }
     
     setIsSubmitting(true);
     setError(null);
     
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       const res = await fetch('/api/payments/refill', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
           'x-tenant-id': tenantId
         },
         body: JSON.stringify({
           category,
           messageQuantity: qtyNum,
           utrNumber
         })
       });
       
       if (!res.ok) {
         const data = await res.json();
         throw new Error(data.message || 'Failed to submit payment request');
       }
       
       setShowSuccess(true);
       setTimeout(() => {
          setShowSuccess(false);
          onClose();
       }, 3000);
     } catch (err) {
       setError(err.message);
     } finally {
       setIsSubmitting(false);
     }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Refill Meta Ad Budget</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select Category and Complete Payment</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 relative">
          
          {showSuccess && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
               <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle2 size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Request Submitted</h3>
               <p className="text-sm font-bold text-slate-500">
                  Payment clarification received. <br/>
                  <span className="text-blue-600">Amount will reflect within 2 hours.</span>
               </p>
            </div>
          )}

          {/* Category Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Message Category</label>
            <select 
               value={category}
               onChange={(e) => setCategory(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
            >
               <option value="MARKETING">Marketing (₹0.93)</option>
               <option value="UTILITY">Utility (₹0.16)</option>
               <option value="AUTHENTICATION">Authentication (₹0.18)</option>
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Message Quantity</label>
            <div className="relative">
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="100"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                Messages
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Standard rate: ₹{ratePerMessage.toFixed(2)} per message</p>
          </div>

          {/* Breakdown Box */}
          <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Price Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Sub-total ({qtyNum.toLocaleString()} × ₹{ratePerMessage})</span>
                <span className="text-sm font-bold text-slate-800">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">GST (18%)</span>
                <span className="text-sm font-bold text-slate-800">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-blue-900">Amount-Locked Transaction</h4>
              <p className="text-[10px] font-bold text-blue-700/70 mt-1">The total amount is pre-configured in the QR code for secure processing.</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center bg-white relative">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Scan to Pay</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6 flex items-center justify-center gap-1">
              📱 PhonePe / UPI Transaction
            </p>

            <div className="inline-block p-4 bg-white rounded-3xl shadow-premium border border-slate-100 mb-6 relative">
              <QRCodeSVG 
                value={upiUrl}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={{
                   src: "https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png",
                   x: undefined,
                   y: undefined,
                   height: 40,
                   width: 60,
                   excavate: true,
                }}
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Details</p>
               <p className="text-sm font-black text-slate-800">{payeeName}</p>
               <p className="text-xs font-bold text-blue-600 mt-0.5">{upiId}</p>
            </div>
          </div>

          {/* UTR Verification Section */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Payment Verification</label>
            <input 
               type="text" 
               placeholder="Enter UTR or Reference Number after payment"
               value={utrNumber}
               onChange={(e) => setUtrNumber(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            {error && <p className="text-[10px] font-bold text-red-500 mt-2">{error}</p>}
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
             onClick={handleSubmitVerification}
             disabled={isSubmitting}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-glow active:scale-[0.98] flex items-center justify-center gap-2"
          >
             <span>{isSubmitting ? 'Submitting...' : 'Submit Payment for Verification'}</span>
             {!isSubmitting && <ExternalLink size={14} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default RefillBudgetModal;
