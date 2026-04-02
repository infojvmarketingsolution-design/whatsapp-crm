import React, { useState } from 'react';
import { Calculator, Smartphone, ShieldCheck, Download, ExternalLink } from 'lucide-react';

const AdBudgetRefill = ({ isModal = false }) => {
  const [numMessages, setNumMessages] = useState(1000);
  
  // Rate Constants
  const RATE_PER_MSG = 0.90;
  const GST_RATE = 0.18;
  
  // Calculations
  const subtotal = numMessages * RATE_PER_MSG;
  const gstAmount = subtotal * GST_RATE;
  const totalAmount = subtotal + gstAmount;

  // UPI Configuration
  const merchantName = "J. V MARKETING SOLUTION P";
  const upiId = "jvmarketingsolution@sbi";
  const transactionNote = encodeURIComponent(`Meta Ad Budget Refill - ${numMessages} msgs`);
  const encodedMerchant = encodeURIComponent(merchantName);
  
  // UPI URI: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodedMerchant}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${transactionNote}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUri)}&size=250x250&format=png&margin=10`;

  const containerClass = isModal ? "" : "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left";

  return (
    <div className={containerClass}>
      {!isModal && (
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calculator className="mr-2 text-blue-600" size={20} />
            Refill Meta Ad Budget
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">Calculate and pay for ad credits instantly</p>
        </div>
      )}

      <div className={`p-6 grid grid-cols-1 ${isModal ? 'lg:grid-cols-1 gap-6' : 'lg:grid-cols-2 gap-8'}`}>
        {/* Left Column: Calculator */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Message Quantity</label>
            <div className="relative">
              <input 
                type="number" 
                value={numMessages}
                onChange={(e) => setNumMessages(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-lg"
                placeholder="Enter quantity..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">Messages</div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Standard rate: ₹0.90 per message</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Price Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600 whitespace-nowrap text-xs">Sub-total ({numMessages.toLocaleString()} x ₹{RATE_PER_MSG})</span>
                <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">GST (18%)</span>
                <span className="text-slate-800 font-bold">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-900 font-black uppercase tracking-tight text-xs">Total Amount</span>
                <span className="text-xl font-black text-blue-600 leading-none">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start sky-50 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <ShieldCheck className="text-blue-500 mr-3 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-bold text-blue-900">Amount-Locked Transaction</p>
              <p className="text-[10px] text-blue-700/70 font-medium mt-0.5">The total amount is pre-configured in the QR code for secure processing.</p>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Merchant Info */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 relative text-center">
          <div className="text-center mb-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">Scan to Pay</h4>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none flex items-center justify-center">
              <Smartphone size={10} className="mr-1" /> UPI Transaction
            </p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 mb-6 relative group">
            <img 
              src={qrUrl} 
              alt="Payment QR" 
              className="w-40 h-40 rounded-lg"
            />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center">
                <Download size={10} className="mr-1.5" /> Download QR
              </div>
            </div>
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Recipient Details</p>
            <p className="text-xs font-black text-slate-800 uppercase">{merchantName}</p>
            <p className="text-xs font-bold text-blue-600 font-mono select-all cursor-pointer hover:underline">{upiId}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 w-full flex justify-center space-x-6">
            <div className="flex flex-col items-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4 grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100" />
            </div>
            <div className="flex flex-col items-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Bhim_Logo.png" alt="BHIM" className="h-4 grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 p-4 text-center">
        <button className="flex items-center justify-center text-white font-black uppercase tracking-[0.2em] text-[10px] mx-auto hover:scale-105 active:scale-95 transition-transform">
          Send Payment receipt for verification <ExternalLink size={12} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default AdBudgetRefill;
