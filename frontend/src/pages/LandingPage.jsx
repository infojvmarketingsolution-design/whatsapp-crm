import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Zap, MessageCircle, BarChart3, Users, ShieldCheck, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center transform rotate-3">
                <MessageCircle size={24} className="text-white transform -rotate-3" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Wapi<span className="text-teal-500">Pulse</span>
              </span>
            </div>
            <div>
              <button
                onClick={handleLoginClick}
                className="group relative inline-flex justify-center items-center px-8 py-3 text-sm font-bold text-white transition-all bg-teal-500 rounded-full hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 overflow-hidden shadow-lg hover:shadow-teal-500/30"
              >
                <div className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></div>
                <span className="relative flex items-center gap-2">
                  Login & New User / Apply
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-teal-100 shadow-sm animate-fade-in-up">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>The Premier WhatsApp Business Solution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-tight animate-fade-in-up delay-75">
            Supercharge Your <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400">
              Customer Engagement
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium animate-fade-in-up delay-150">
            WapiPulse bridges the gap between your brand and your audience. Harness the power of WhatsApp API, AI Chatbots, and comprehensive CRM tools—all native, all under one roof.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-200">
            <button
              onClick={handleLoginClick}
              className="px-8 py-4 text-lg font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              Start Free Trial Today
            </button>
            <button 
              onClick={() => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 text-lg font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              Explore Features
            </button>
          </div>
        </div>
      </div>

      {/* Features / Advantages */}
      <div id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-teal-500 font-bold tracking-wide uppercase text-sm mb-2">Platform Advantages</h2>
            <p className="text-3xl md:text-4xl font-black text-slate-900">Everything you need to scale</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 border border-slate-100 group">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors">
                <Bot size={28} className="text-teal-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Powered Automation</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Instantly qualify leads and resolve queries automatically with our built-in customized ChatGPT-driven flow sequences.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 border border-slate-100 group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                <MessageCircle size={28} className="text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">WhatsApp API Inbox</h3>
              <p className="text-slate-600 leading-relaxed font-medium">A powerful centralized inbox meant for high-velocity teams. Manage unlimited chats without missing a beat.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 border border-slate-100 group">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                <Zap size={28} className="text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mass Campaigns</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Send personalized, engaging WhatsApp broadcasts to thousands of opted-in customers instantly, driving massive ROI.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-teal-400 font-bold tracking-wide uppercase text-sm mb-2">Why About Us</h2>
              <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Built for businesses that demand excellence.</h3>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                We didn't just build another CRM. We built a comprehensive growth engine. Unlike disjointed tools, WapiPulse seamlessly marries official Meta WhatsApp connectivity with state-of-the-art contact pipelines.
              </p>
              
              <ul className="space-y-5">
                {[
                  'Official Meta Tech Partner Integration',
                  'Zero unexpected downtimes & limits',
                  'Granular analytics for your entire team',
                  'Secure, enterprise-grade data protection'
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={24} className="text-teal-400 flex-shrink-0" />
                    <span className="text-lg font-medium text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-purple-500/20 blur-3xl transform -skew-y-12 rounded-full"></div>
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl relative shadow-2xl backdrop-blur-sm">
                 <div className="flex items-center justify-between border-b border-slate-700 pb-6 mb-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <BarChart3 className="text-slate-900" size={24} />
                       </div>
                       <div>
                          <h4 className="font-bold text-xl">Conversion Rate</h4>
                          <p className="text-emerald-400 font-semibold">+342% this quarter</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-teal-500 w-[80%] rounded-full"></div>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-500 w-[90%] rounded-full"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing / Plans */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-teal-500 font-bold tracking-wide uppercase text-sm mb-2">Simple Pricing</h2>
            <p className="text-3xl md:text-4xl font-black text-slate-900">Choose the perfect plan for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="border border-slate-200 rounded-3xl p-8 bg-white hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 mb-6 font-medium">Perfect for small businesses getting started.</p>
              <div className="text-4xl font-black text-slate-900 mb-8">$29<span className="text-lg font-medium text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-8">
                {['1,000 Contacts', 'Basic Campaigns', 'Standard Inbox', 'Email Support'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={20} className="text-teal-500" />
                    <span className="text-slate-600 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">Start Free Trial</button>
            </div>

            {/* Pro Plan */}
            <div className="border border-teal-500 rounded-3xl p-8 bg-teal-600 text-white relative shadow-2xl scale-105 transform">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">Most Popular</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-teal-100 mb-6 font-medium">Everything you need to automate & scale.</p>
              <div className="text-4xl font-black mb-8">$79<span className="text-lg font-medium text-teal-200">/mo</span></div>
              <ul className="space-y-4 mb-8">
                {['10,000 Contacts', 'Advanced Campaigns', 'AI Chatbot Flows', 'Team Collaboration', 'Priority Support'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={20} className="text-teal-200" />
                    <span className="font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-teal-600 bg-white hover:bg-slate-50 shadow-lg transition-colors">Get Started</button>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-slate-200 rounded-3xl p-8 bg-white hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 mb-6 font-medium">Tailored for high-volume operations.</p>
              <div className="text-4xl font-black text-slate-900 mb-8">Custom</div>
              <ul className="space-y-4 mb-8">
                {['Unlimited Contacts', 'Dedicated Account Mgr', 'Custom Integrations', 'SLA Guarantees'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={20} className="text-teal-500" />
                    <span className="text-slate-600 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Wapi<span className="text-teal-500">Pulse</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Revolutionizing businesses globally with advanced conversational marketing tools tailored for WhatsApp.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
                <li><a href="/privacy-policy" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Connect With Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2"><Phone size={16} /> <span>+1 (800) 123-4567</span></li>
                <li className="flex items-center space-x-2"><Mail size={16} /> <span>hello@wapipulse.com</span></li>
                <li className="flex items-start space-x-2 mt-4"><MapPin size={16} className="mt-1 flex-shrink-0" /> <span>Global Headquarters<br/>Innovation Hub, Tech District</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {new Date().getFullYear()} WapiPulse. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
               <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-slate-300 font-medium flex items-center shadow-inner">
                  Developed by <strong className="text-teal-400 ml-1">J.V group</strong>
               </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
