import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-brand-light p-10 text-white text-center">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-white/80 font-medium italic">Last Updated: March 21, 2026</p>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8 text-gray-700 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              1. Introduction
            </h2>
            <p>
              Welcome to the <strong>J.V Marketing Solution CRM</strong>. We are committed to protecting your personal data and your privacy. This Privacy Policy outlines how we collect, use, and safeguard the information you provide when using our platform and its integrated WhatsApp Business API services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              2. Data We Collect
            </h2>
            <p>To provide our services, we may collect the following information:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><strong>Contact Information:</strong> Phone numbers and profile names obtained through the WhatsApp Business API.</li>
              <li><strong>Message Data:</strong> History of messages sent and received via our platform for CRM tracking.</li>
              <li><strong>User Account Details:</strong> Business email, name, and administrative credentials for managing the CRM.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              3. How We Use Your Data
            </h2>
            <p>Your data is used strictly for the following purposes:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Facilitating real-time communication between businesses and customers via WhatsApp.</li>
              <li>Managing marketing campaigns and automated messaging flows.</li>
              <li>Providing analytics on message delivery, read rates, and engagement.</li>
              <li>Ensuring the security and integrity of independent tenant workspaces.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              4. WhatsApp & Meta API Integration
            </h2>
            <p>
              Our platform integrates directly with the <strong>Meta Graph API</strong>. By connecting your WhatsApp Business account, you acknowledge that your data is also subject to <a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">WhatsApp's Business Policy</a> and Meta's Privacy Terms. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              5. Data Storage & Security
            </h2>
            <p>
              We utilize <strong>Isolated Tenant Databases</strong> to ensure your business data is never mixed with other users. All communications are protected by modern encryption standards (SSL/TLS) during transmission. 
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-brand-light rounded-full mr-3"></span>
              6. Your Rights
            </h2>
            <p>
              Under applicable data protection laws, you have the right to access, correct, or delete your personal information. If you wish to exercise these rights, please contact our support team at <span className="text-blue-600">admin@demo.com</span>.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center sm:items-end">
            <div className="mb-4 sm:mb-0">
               <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">J.V Marketing Solution Pvt Ltd</p>
               <p className="text-xs text-gray-500 font-medium">© 2026 All Rights Reserved</p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
