import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, CheckCircle2, Phone, Mail, MapPin, 
  Send, Bot, BarChart3, Users, PlayCircle, Star
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => navigate('/login');

  return (
    <div className="font-sans bg-white selection:bg-[#25D366] selection:text-white overflow-x-hidden text-gray-800">
      
      {/* 1. Navbar - Clean, White, Sticky (AiSensy Style) */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Massive Logo as requested */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/logo.png" alt="WapiPulse Logo" className="h-16 md:h-20 object-contain drop-shadow-sm" />
            </div>

            {/* Desktop Center Links */}
            <div className="hidden md:flex space-x-8 text-[15px] font-bold text-gray-600">
               <a href="#features" className="hover:text-[#25D366] transition-colors">Platform Features</a>
               <a href="#broadcast" className="hover:text-[#25D366] transition-colors">Broadcast</a>
               <a href="#automation" className="hover:text-[#25D366] transition-colors">Chatbot</a>
               <a href="#pricing" className="hover:text-[#25D366] transition-colors">Pricing</a>
            </div>
            
            {/* Premium CTA Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLoginClick}
                className="hidden md:inline-flex items-center font-bold text-gray-700 hover:text-[#075E54] transition-colors"
              >
                Login
              </button>
              <button
                onClick={handleLoginClick}
                className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 px-6 rounded-lg shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5 transition-all flex items-center gap-2 text-[15px]"
              >
                New User? Apply <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. Transformative AiSensy Hero Section */}
      <section className="pt-40 pb-20 lg:pt-48 lg:pb-32 relative bg-[#f9fafb] overflow-hidden">
        {/* Background circular glow (subtle) */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-[#25D366]/10 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left/Text Side */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
               className="text-center lg:text-left z-10"
            >
              <div className="inline-flex items-center space-x-2 bg-white text-[#075E54] px-4 py-2 rounded-full text-sm font-extrabold mb-6 shadow-sm border border-gray-100">
                <ShieldCheck size={16} className="text-[#25D366]" />
                <span>#1 WhatsApp API Marketing Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-[4rem] font-black text-[#111827] leading-[1.1] mb-6 tracking-tight">
                Grow your business <br className="hidden md:block"/>on <span className="text-[#25D366]">WhatsApp</span> effortlessly
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                WapiPulse is the complete WhatsApp Marketing CRM built for scale. Engage globally, automate 24/7 with Official Green Tick Chatbots, and drive massive ROI.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleLoginClick}
                  className="w-full sm:w-auto bg-[#1DA851] hover:bg-[#15803d] text-white font-extrabold text-lg py-4 px-10 rounded-xl shadow-[0_8px_30px_rgb(37,211,102,0.3)] hover:-translate-y-1 transition-transform border border-[#16a34a] flex items-center justify-center"
                >
                  Start free trial <ArrowRight className="ml-2" size={20} />
                </button>
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-500">
                   <CheckCircle2 size={18} className="text-[#25D366]" />
                   <span>No Credit Card Required</span>
                </div>
              </div>
            </motion.div>

            {/* Right/Character & Visual Side */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="relative lg:ml-auto z-10 flex justify-center"
            >
               {/* Decorative background shape for character */}
               <div className="absolute inset-0 bg-[#25D366]/5 rounded-3xl transform rotate-3 scale-105"></div>
               <div className="absolute inset-0 bg-[#075E54]/5 rounded-3xl transform -rotate-3 scale-105"></div>
               
               {/* 3D Mascot Generated Character */}
               <motion.img 
                  animate={{ y: [-15, 15, -15] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  src="/3d_mascot.png" 
                  alt="WapiPulse 3D Mascot" 
                  className="relative z-20 w-full max-w-lg object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]"
                  onError={(e) => {
                     // Fallback mock if mascot wasn't downloaded properly by browser cache somehow
                     e.target.style.display = 'none';
                     document.getElementById('css-mock').style.display = 'block';
                  }}
               />
               
               {/* Hidden CSS fallback purely in case image fails */}
               <div id="css-mock" className="hidden relative z-20 w-full max-w-md bg-white p-6 rounded-[2rem] shadow-2xl border-4 border-gray-100">
                  <div className="flex items-center space-x-3 mb-6 bg-[#f0fdf4] p-4 rounded-xl">
                     <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                        <Bot className="text-white" size={24} />
                     </div>
                     <div>
                        <p className="font-bold text-gray-800">WapiPulse AI</p>
                        <p className="text-xs text-[#25D366] font-bold">Online</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none self-start w-3/4">Hi! We need a scalable WhatsApp API solution.</div>
                     <div className="bg-[#25D366] text-white p-3 rounded-xl rounded-tr-none self-end w-3/4 ml-auto">Absolutely! With WapiPulse, you're set up in 10 minutes. 🚀</div>
                     <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none self-start w-3/4">Amazing, let's start the integration!</div>
                  </div>
               </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Trusted By Ticker */}
      <section className="py-10 border-b border-gray-100 bg-white shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Trusted by fast-growing enterprises worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Abstract Logos using Lucide */}
             <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-blue-600 rounded-lg"></div><h3 className="text-xl font-black">AcmeCorp</h3></div>
             <div className="flex items-center space-x-2"><div className="w-8 h-8 rounded-full border-[6px] border-purple-600"></div><h3 className="text-xl font-black tracking-tighter">GlobalTech</h3></div>
             <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-red-500 rounded-tr-2xl rounded-bl-2xl"></div><h3 className="text-xl font-black italic">SwiftSell</h3></div>
             <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-black rounded-sm transform rotate-45"></div><h3 className="text-xl font-black">Vibrant</h3></div>
             <div className="flex items-center space-x-2"><div className="w-8 h-8 rounded-full bg-emerald-500 opacity-80"></div><h3 className="text-xl font-black uppercase">Oasis</h3></div>
          </div>
        </div>
      </section>

      {/* 4. Strategic Z-Pattern Features Sections */}
      <div id="features" className="bg-white">
        
        {/* Feature 1: Broadcast (Text Left, Image Right) */}
        <section id="broadcast" className="py-24 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
              >
                <div className="w-14 h-14 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                  <Send className="text-[#25D366]" size={28} />
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  Reach thousands instantly with <span className="text-[#25D366]">WhatsApp Broadcasts</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 font-medium">
                  Send personalized offers, alerts, and multimedia messages to massive opted-in audiences. Experience open rates up to 98% and click-through rates higher than traditional emails.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Personalized Rich Media Messages', 'Smart Contact Tagging & Segmentation', 'Real-time Delivery & Read Analytics'].map((feat, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <CheckCircle2 size={24} className="text-[#25D366] shrink-0" />
                      <span className="text-gray-800 font-bold">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleLoginClick} className="font-bold text-[#1DA851] hover:text-[#15803d] flex items-center text-lg group">
                  Explore Broadcasting <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
              
              <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 className="relative"
              >
                 <div className="absolute inset-0 bg-blue-50 transform rotate-3 rounded-[3rem]"></div>
                 <div className="relative bg-white border-2 border-gray-100 p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    <h4 className="font-black text-lg mb-4 text-gray-800">Campaign Analytics</h4>
                    <div className="space-y-6">
                       <div className="flex items-end space-x-2 h-32">
                          <div className="w-full bg-gray-100 rounded-t-lg relative"><div className="absolute bottom-0 w-full h-[60%] bg-[#128C7E] rounded-t-lg"></div></div>
                          <div className="w-full bg-gray-100 rounded-t-lg relative"><div className="absolute bottom-0 w-full h-[85%] bg-[#25D366] rounded-t-lg hover:h-[90%] transition-all cursor-pointer"></div></div>
                          <div className="w-full bg-gray-100 rounded-t-lg relative"><div className="absolute bottom-0 w-full h-[40%] bg-yellow-400 rounded-t-lg"></div></div>
                          <div className="w-full bg-gray-100 rounded-t-lg relative"><div className="absolute bottom-0 w-full h-[70%] bg-blue-500 rounded-t-lg"></div></div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                             <p className="text-xs font-bold text-gray-400 uppercase">Messages Sent</p>
                             <p className="text-3xl font-black text-gray-900 mt-1">24,500</p>
                          </div>
                          <div className="border border-green-100 rounded-xl p-4 bg-green-50 shadow-inner">
                             <p className="text-xs font-bold text-[#1DA851] uppercase">Open Rate</p>
                             <p className="text-3xl font-black text-[#1DA851] mt-1">98.4%</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature 2: Chatbot (Image Left, Text Right) */}
        <section id="automation" className="py-24 lg:py-32 bg-[#f9fafb] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 className="order-2 lg:order-1 relative"
              >
                 <div className="absolute inset-0 bg-[#075E54]/5 transform -rotate-3 rounded-[3rem]"></div>
                 <div className="relative bg-white border border-gray-200 p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
                       <Bot size={40} className="text-[#075E54]" />
                       <div>
                          <h4 className="font-black text-xl text-gray-900">Flow Builder AI</h4>
                          <p className="text-[#25D366] font-bold text-sm">Always Online</p>
                       </div>
                    </div>
                    
                    <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-[#25D366] before:via-gray-100 before:to-transparent">
                       <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#25D366] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 left-0 absolute top-0 -ml-[1.3rem]" />
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm w-full">
                             <p className="font-bold text-gray-800 text-sm">User clicks Facebook Ad</p>
                          </div>
                       </div>
                       <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 left-0 absolute top-0 -ml-[1.3rem]" />
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm w-full">
                             <p className="font-bold text-blue-900 text-sm">Sends automated WhatsApp Intro</p>
                          </div>
                       </div>
                       <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#075E54] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 left-0 absolute top-0 -ml-[1.3rem]" />
                          <div className="bg-[#075E54]/5 p-4 rounded-xl border border-[#075E54]/10 shadow-sm w-full">
                             <p className="font-bold text-gray-800 text-sm">Collects User Email & Intent</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 className="order-1 lg:order-2"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Bot className="text-blue-600" size={28} />
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  Automate Sales & Support with <span className="text-blue-600">Smart AI Chatbots</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 font-medium">
                  Provide 24/7 customer support, auto-qualify leads, and drive sales through highly interactive drag-and-drop conversational flows. No coding required.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Drag & Drop Visual Flow Builder', 'Human Handover Capabilities', 'Capture custom variables (Email, Name)'].map((feat, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <CheckCircle2 size={24} className="text-blue-600 shrink-0" />
                      <span className="text-gray-800 font-bold">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleLoginClick} className="font-bold text-blue-600 hover:text-blue-800 flex items-center text-lg group">
                  Discover Automation <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Feature 3: Green Tick & Inbox (Text Left, Image Right) */}
        <section className="py-24 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
              >
                <div className="w-14 h-14 bg-[#128C7E]/10 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="text-[#128C7E]" size={28} />
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  Unlock the <span className="text-[#128C7E]">Official Green Tick</span> & Multi-Agent Inbox
                </h2>
                <p className="text-lg text-gray-600 mb-8 font-medium">
                  Establish brand credibility with the Official WhatsApp Green Tick. Let your entire team manage thousands of customer chats simultaneously through our unified premium inbox.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Official Meta Partner Integration', 'Shared Team Inbox & Live Agent Routing', 'Granular Security and Analytics'].map((feat, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <CheckCircle2 size={24} className="text-[#128C7E] shrink-0" />
                      <span className="text-gray-800 font-bold">{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true, margin: "-100px" }}
                 className="relative"
              >
                 <div className="bg-[#075E54] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><ShieldCheck size={150} className="text-white" /></div>
                    <div className="relative z-10 flex items-center space-x-4 mb-10">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-lg">
                          <img src="/logo.png" alt="Brand" className="object-contain" />
                       </div>
                       <div>
                          <div className="flex items-center space-x-2">
                             <h4 className="font-black text-2xl text-white">Your Brand</h4>
                             <div className="w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center shadow-glow">
                                <CheckCircle2 size={16} className="text-white" />
                             </div>
                          </div>
                          <p className="text-teal-200 font-bold">Official Business Account</p>
                       </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
                       <p className="text-white font-medium italic">"We've verified that this phone number belongs to an authentic notable brand."</p>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Minimalistic Pricing Card layout */}
      <section id="pricing" className="py-24 bg-[#f9fafb] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xl font-bold text-[#25D366] uppercase tracking-wider mb-2">Pricing</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900">Transparent & Scalable</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <div className="bg-white p-10 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl transition-all">
                <h4 className="text-2xl font-black mb-2">Professional</h4>
                <p className="text-gray-500 font-medium mb-6">Everything you need to grow.</p>
                <div className="text-[3rem] font-black leading-none mb-8">$79<span className="text-lg text-gray-400 font-bold">/mo</span></div>
                <button onClick={handleLoginClick} className="w-full bg-[#1DA851] text-white font-bold py-4 rounded-xl mb-8 shadow-glow hover:-translate-y-1 transition-all">Start Free Trial</button>
                <ul className="space-y-4">
                   {['10,000 Contacts Included', 'Advanced Flow Builder', 'Email & Chat Support'].map((f, i) => (
                      <li key={i} className="flex items-center font-bold text-gray-700"><CheckCircle2 className="text-[#25D366] mr-3" size={20} />{f}</li>
                   ))}
                </ul>
             </div>
             
             <div className="bg-[#075E54] text-white p-10 rounded-[2rem] shadow-2xl relative mt-4 md:mt-0">
                <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-yellow-400 text-black font-black uppercase text-[10px] px-4 py-1.5 rounded-full">For Scale</div>
                <h4 className="text-2xl font-black mb-2">Enterprise</h4>
                <p className="text-teal-200 font-medium mb-6">Tailored solutions for large teams.</p>
                <div className="text-[3rem] font-black leading-none mb-8">Custom</div>
                <button onClick={handleLoginClick} className="w-full bg-white text-[#075E54] font-bold py-4 rounded-xl mb-8 hover:bg-gray-100 transition-colors">Contact Sales</button>
                <ul className="space-y-4">
                   {['Unlimited Contacts', 'Dedicated Account Manager', 'Custom API Integrations'].map((f, i) => (
                      <li key={i} className="flex items-center text-white font-bold"><CheckCircle2 className="text-[#25D366] mr-3 border-none bg-white rounded-full" size={20} />{f}</li>
                   ))}
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* 6. Heavy AiSensy Bottom CTA */}
      <section className="bg-[#128C7E] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Ready to grow your business on WhatsApp?</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <button onClick={handleLoginClick} className="bg-white text-[#128C7E] font-black py-4 px-10 rounded-xl hover:scale-105 transition-transform text-lg shadow-2xl">Start 14-Day Free Trial</button>
             <button onClick={handleLoginClick} className="bg-transparent border-2 border-white text-white font-black py-4 px-10 rounded-xl hover:bg-white/10 transition-colors text-lg">Book a Demo</button>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Heavy Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="lg:col-span-4">
              <div className="bg-white/10 p-4 rounded-2xl w-fit mb-6">
                <img src="/logo.png" alt="WapiPulse Logo" className="h-14 md:h-16 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>
              <p className="text-slate-400 font-medium mb-6 pr-4 leading-relaxed">
                WapiPulse is the most robust official WhatsApp API CRM platform, providing businesses the tools to automate, broadcast, and conquer on the world's most popular messaging app.
              </p>
            </div>
            
            {/* Use Cases Column */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Solutions</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#" className="hover:text-[#25D366] transition-colors">WhatsApp Broadcasting</a></li>
                <li><a href="#" className="hover:text-[#25D366] transition-colors">WhatsApp Chatbots</a></li>
                <li><a href="#" className="hover:text-[#25D366] transition-colors">Shared Team Inbox</a></li>
                <li><a href="#" className="hover:text-[#25D366] transition-colors">Click to WhatsApp Ads</a></li>
              </ul>
            </div>
            
            {/* Company Column */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#" className="hover:text-[#25D366] transition-colors">About Us</a></li>
                <li><a href="/privacy-policy" className="hover:text-[#25D366] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#25D366] transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#25D366] transition-colors">Refund Policy</a></li>
              </ul>
            </div>
            
            {/* Contact Column (As Requested) */}
            <div className="lg:col-span-4 lg:pl-10">
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Contact Us</h4>
              <ul className="space-y-5 text-sm font-bold text-slate-300">
                <li className="flex items-center space-x-4">
                   <div className="bg-slate-800 p-3 rounded-full text-[#25D366]"><Phone size={18} /></div>
                   <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">India (Sales & Support)</span>
                      <span className="text-lg text-white group-hover:text-[#25D366] transition-colors">+91 9909700606</span>
                   </div>
                </li>
                <li className="flex items-center space-x-4">
                   <div className="bg-slate-800 p-3 rounded-full text-[#25D366]"><Phone size={18} className="rotate-90"/></div>
                   <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">UK HQ</span>
                      <span className="text-lg text-white group-hover:text-[#25D366] transition-colors">+44 7344556070</span>
                   </div>
                </li>
                <li className="flex items-center space-x-4">
                   <div className="bg-slate-800 p-3 rounded-full text-[#25D366]"><Mail size={18} /></div>
                   <span className="text-lg text-white group-hover:text-[#25D366] transition-colors hover:underline">Support@wapipulse.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright Area */}
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-bold text-slate-500">
            <p>&copy; {new Date().getFullYear()} WapiPulse. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex items-center space-x-2 group">
               <span className="px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-slate-300">
                  Developed by <strong className="text-[#25D366] ml-1">J.V group</strong>
               </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
