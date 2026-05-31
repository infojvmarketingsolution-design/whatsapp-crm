import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

function RefillBudgetModal({ isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1000);
  
  if (!isOpen) return null;

  // Rate constants
  const ratePerMessage = 0.90;
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

  const handleSupportRedirect = () => {
     // Redirect to WhatsApp with pre-filled message
     const supportNumber = '916354070709'; 
     const message = `Hello, I have just made a payment of ₹${totalAmount.toFixed(2)} for ${qtyNum} Meta Ad Budget Credits. Please verify and update my wallet.`;
     window.open(`https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Refill Meta Ad Budget</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select Quantity and Complete Payment</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
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
            
            <div className="flex justify-center gap-4 mt-6 opacity-50 grayscale">
               {/* Placeholder logos for UPI apps */}
               <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
               <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
               <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
             onClick={handleSupportRedirect}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-glow active:scale-[0.98] flex items-center justify-center gap-2"
          >
             <span>Send Payment Receipt for Verification</span>
             <ExternalLink size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default RefillBudgetModal;
