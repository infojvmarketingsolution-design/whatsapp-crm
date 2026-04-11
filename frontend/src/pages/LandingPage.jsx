import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Bot, Zap, MessageCircle, BarChart3, Users, 
  CheckCircle2, Phone, Mail, MapPin, 
  Send, Database, ShieldCheck, PlayCircle, Star
} from 'lucide-react';

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax Values
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacityFade = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => navigate('/login');

  return (
    <div className="min-h-screen bg-crm-bg font-sans selection:bg-[#25D366] selection:text-white overflow-x-hidden relative">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
           className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#128C7E]/10 rounded-full blur-[120px]"
           animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
           className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#25D366]/10 rounded-full blur-[100px]"
           animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Navbar - Sticky & Glassmorphic */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 flex items-center space-x-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img src="/logo.png" alt="WapiPulse Logo" className="h-10 object-contain drop-shadow-sm" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={handleLoginClick}
                className="group relative inline-flex justify-center items-center px-7 py-2.5 text-sm font-bold text-white transition-all bg-[#075E54] rounded-full hover:bg-[#128C7E] focus:outline-none overflow-hidden shadow-[0_4px_15px_rgba(7,94,84,0.3)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Portal Login
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 h-full w-0 bg-[#25D366] transition-all duration-300 ease-out group-hover:w-full z-0"></div>
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Hero Content */}
            <motion.div 
              className="lg:col-span-6 text-center lg:text-left"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-[#128C7E]/20 text-[#075E54] px-4 py-2 rounded-full text-sm font-bold mb-8 shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#128C7E]"></span>
                </span>
                <span>The Premier WhatsApp Business Solution</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">
                Supercharge <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#128C7E] to-[#25D366]">Customer Engagement.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="mt-4 text-xl text-gray-600 mb-10 leading-relaxed font-medium">
                WapiPulse seamlessly integrates official Meta API with intelligent CRM. Automate flows, manage mass campaigns, and close deals natively inside WhatsApp.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <button
                  onClick={handleLoginClick}
                  className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-[#075E54] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] rounded-full shadow-glow transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <PlayCircle size={20} />
                  <span>Start Free Trial Today</span>
                </button>
                <div className="flex items-center justify-center space-x-4 px-6 text-sm font-bold text-gray-500">
                   <div className="flex -space-x-2">
                     {[1,2,3,4].map(i => (
                       <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden z-[${5-i}]`}>
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                       </div>
                     ))}
                   </div>
                   <span>Join 10,000+ businesses</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visuals / Mockup */}
            <motion.div 
               className="lg:col-span-6 mt-16 lg:mt-0 relative hidden md:block"
               style={{ y: y2, opacity: opacityFade }}
            >
               <div className="relative w-full aspect-square max-w-lg mx-auto">
                 {/* Floating CRM Dashboard Mock */}
                 <motion.div 
                    className="absolute inset-0 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col p-4"
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                 >
                    {/* Mock Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                       <div className="flex items-center space-x-2">
                          <img src="/logo.png" className="h-6" alt="mock" />
                       </div>
                       <div className="flex space-x-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-[#25D366]"></div>
                       </div>
                    </div>
                    {/* Mock Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <div className="bg-[#f8fafc] p-3 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Campaigns</p>
                          <p className="text-xl font-black text-gray-800">12,450</p>
                       </div>
                       <div className="bg-[#128C7E]/10 p-3 rounded-xl border border-[#128C7E]/20">
                          <p className="text-[10px] text-[#075E54] font-bold uppercase mb-1">Open Rate</p>
                          <p className="text-xl font-black text-[#128C7E]">98.2%</p>
                       </div>
                    </div>
                    {/* Mock Chat */}
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 flex flex-col justify-end space-y-2 border border-gray-100 relative overflow-hidden">
                       <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm text-[10px] font-medium max-w-[80%] border border-gray-100 self-start">
                          Hey! I'm interested in the SaaS plan.
                       </div>
                       <div className="bg-[#128C7E] text-white p-2 rounded-lg rounded-tr-none shadow-sm text-[10px] font-medium max-w-[80%] self-end flex items-center space-x-1">
                          <span>We'd love to help! Let me send the details.</span>
                          <CheckCircle2 size={10} className="text-[#25D366] ml-1" />
                       </div>
                    </div>
                 </motion.div>
                 
                 {/* Floating Badges */}
                 <motion.div 
                    className="absolute -right-8 top-20 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center space-x-3"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                 >
                    <div className="bg-[#25D366] text-white p-2 rounded-full"><Bot size={16} /></div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400">AI Automation</p>
                       <p className="text-sm font-black text-gray-800">Active</p>
                    </div>
                 </motion.div>
               </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Metrics / Social Proof */}
      <section className="py-10 bg-white border-y border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
             {[
               { val: "99.9%", label: "Uptime SLA" },
               { val: "250M+", label: "Messages Sent" },
               { val: "4.9/5", label: "Customer Rating", icon: Star },
               { val: "10x", label: "ROI Average" }
             ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="text-center px-4"
                >
                   <h3 className="text-3xl md:text-4xl font-black text-[#075E54] flex items-center justify-center gap-1">
                      {stat.val} {stat.icon && <stat.icon size={24} className="text-yellow-400 fill-yellow-400" />}
                   </h3>
                   <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </motion.div>
             ))}
           </div>
        </div>
      </section>

      {/* Platform Advantages */}
      <section className="py-24 relative z-10 bg-crm-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-[#128C7E] font-extrabold tracking-widest uppercase text-[10px] mb-3">Enterprise Capabilities</h2>
            <p className="text-4xl md:text-5xl font-black text-gray-900">Accelerate your pipeline.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Bot, color: "text-[#25D366]", bg: "bg-[#25D366]/10", border: "group-hover:border-[#25D366]/50", title: "AI Flow Engine", desc: "Build stateful chatbots that autonomously qualify leads and schedule meetings without human intervention." },
              { icon: MessageCircle, color: "text-[#128C7E]", bg: "bg-[#128C7E]/10", border: "group-hover:border-[#128C7E]/50", title: "Omnichannel Inbox", desc: "A singular view for your entire team to manage Meta-verified WhatsApp conversations concurrently." },
              { icon: Send, color: "text-[#075E54]", bg: "bg-[#075E54]/10", border: "group-hover:border-[#075E54]/50", title: "Mass Campaigns", desc: "Broadcast personalized rich-media templates to thousands of opted-in users in seconds." }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -10 }}
                className={`bg-white rounded-3xl p-8 shadow-soft border border-gray-100 transition-all duration-300 group ${feat.border} relative overflow-hidden`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feat.bg}`}>
                  <feat.icon size={28} className={`${feat.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{feat.desc}</p>
                
                {/* Decorative background element */}
                <div className="absolute -bottom-10 -right-10 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <feat.icon size={150} className={`${feat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Tech Specs */}
      <section className="py-24 bg-white relative z-10 border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
               style={{ y: y1 }}
               className="relative"
            >
              <div className="bg-[#f8fafc] border border-gray-100 p-8 rounded-[40px] relative shadow-premium">
                 <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center">
                          <BarChart3 className="text-[#128C7E]" size={28} />
                       </div>
                       <div>
                          <h4 className="font-extrabold text-2xl text-gray-900">Performance</h4>
                          <p className="text-[#25D366] font-bold text-sm tracking-wide">+342% Conversion</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-500 mb-2"><span>Open Rate</span><span>98%</span></div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} whileInView={{ width: "98%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.2 }} className="h-full bg-[#25D366] rounded-full"></motion.div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-500 mb-2"><span>Click-Through</span><span>65%</span></div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} whileInView={{ width: "65%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.4 }} className="h-full bg-[#128C7E] rounded-full"></motion.div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-500 mb-2"><span>Agent Efficiency</span><span>85%</span></div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.6 }} className="h-full bg-[#075E54] rounded-full"></motion.div>
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
            >
              <h2 className="text-[#128C7E] font-extrabold tracking-widest uppercase text-[10px] mb-3">Why WapiPulse</h2>
              <h3 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 leading-tight">Built for businesses that demand excellence.</h3>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed font-medium">
                We didn't just build another CRM. We built a comprehensive growth engine. Unlike disjointed tools, WapiPulse seamlessly marries official Meta WhatsApp connectivity with state-of-the-art contact pipelines.
              </p>
              
              <ul className="space-y-5">
                {[
                  'Official Meta Tech Partner Integration',
                  'Zero unexpected downtimes & limits',
                  'Advanced Team & Role Management',
                  'Enterprise-grade AES-256 Cloud Security'
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <CheckCircle2 size={24} className="text-[#25D366] flex-shrink-0" />
                    <span className="text-sm font-bold text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Pricing / Plans */}
      <section className="py-24 relative z-10 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-[#128C7E] font-extrabold tracking-widest uppercase text-[10px] mb-3">Transparent Pricing</h2>
            <p className="text-4xl md:text-5xl font-black text-gray-900">Choose the perfect plan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <motion.div 
               whileHover={{ y: -10 }}
               className="border border-gray-200 rounded-[30px] p-8 bg-white hover:shadow-premium transition-all relative flex flex-col"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 mb-6 font-medium text-sm">Perfect for small businesses getting started.</p>
              <div className="text-5xl font-black text-gray-900 mb-8">$29<span className="text-lg font-bold text-gray-400">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1,000 Contacts', 'Basic Campaigns', 'Standard Inbox', 'Email Support'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-[#25D366]" />
                    <span className="text-gray-600 font-bold text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-[#075E54] bg-[#f8fafc] hover:bg-[#128C7E]/10 border border-gray-200 transition-colors">Start Free Trial</button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
               whileHover={{ y: -10 }}
               className="border border-[#128C7E] rounded-[30px] p-8 bg-[#075E54] text-white relative shadow-[0_20px_50px_rgba(7,94,84,0.3)] md:-mt-8 md:mb-8 flex flex-col z-10"
            >
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">Most Popular</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Professional</h3>
              <p className="text-teal-100 mb-6 font-medium text-sm">Everything you need to automate & scale.</p>
              <div className="text-5xl font-black mb-8 text-white">$79<span className="text-lg font-bold text-teal-200">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['10,000 Contacts', 'Advanced Campaigns', 'Premium AI Chatbot Flows', 'Team Collaboration', 'Priority 24/7 Support'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-[#25D366]" />
                    <span className="font-bold text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-[#075E54] bg-white hover:bg-gray-50 shadow-glow transition-all ring-2 ring-white">Get Started</button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
               whileHover={{ y: -10 }}
               className="border border-gray-200 rounded-[30px] p-8 bg-white hover:shadow-premium transition-all relative flex flex-col"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-500 mb-6 font-medium text-sm">Tailored for high-volume operations.</p>
              <div className="text-5xl font-black text-gray-900 mb-8">Custom</div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited Contacts', 'Dedicated Account Mgr', 'Custom White-labeling', 'SLA Guarantees'].map((feat, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 size={18} className="text-[#25D366]" />
                    <span className="text-gray-600 font-bold text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleLoginClick} className="w-full py-4 rounded-xl font-bold text-[#075E54] bg-[#f8fafc] hover:bg-[#128C7E]/10 border border-gray-200 transition-colors">Contact Sales</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modern Footer using Brand Colors */}
      <footer className="bg-white border-t border-gray-200 pt-20 pb-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            <div className="md:col-span-4">
              <div className="flex items-center space-x-2 mb-6">
                <img src="/logo.png" alt="WapiPulse Logo" className="h-10 object-contain" />
              </div>
              <p className="text-sm leading-relaxed text-gray-500 font-medium mb-6 pr-4">
                Revolutionizing businesses globally with advanced conversational marketing tools completely tailored for WhatsApp.
              </p>
              <div className="flex space-x-4">
                 {/* Decorative social placeholders */}
                 {['#075E54', '#128C7E', '#25D366'].map((color, i) => (
                    <div key={i} style={{backgroundColor: color}} className="w-8 h-8 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer transition-opacity"></div>
                 ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="text-gray-900 font-black mb-6 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="text-gray-900 font-black mb-6 uppercase text-xs tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">About Us</a></li>
                <li><a href="/privacy-policy" className="hover:text-[#128C7E] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#128C7E] transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h4 className="text-gray-900 font-black mb-6 uppercase text-xs tracking-widest">Contact Support</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600">
                <li className="flex items-center space-x-3 group cursor-pointer">
                   <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#25D366] group-hover:text-white transition-colors"><Phone size={16} /></div>
                   <span className="group-hover:text-[#075E54]">+91 9909700606</span>
                </li>
                <li className="flex items-center space-x-3 group cursor-pointer">
                   <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#25D366] group-hover:text-white transition-colors"><Phone size={16} className="rotate-90"/></div>
                   <span className="group-hover:text-[#075E54]">+44 7344556070</span>
                </li>
                <li className="flex items-center space-x-3 group cursor-pointer">
                   <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[#128C7E] group-hover:text-white transition-colors"><Mail size={16} /></div>
                   <span className="group-hover:text-[#075E54]">Support@wapipulse.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-bold text-gray-400">
            <p>&copy; {new Date().getFullYear()} WapiPulse. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
               <span className="px-4 py-1.5 bg-[#f8fafc] rounded-full border border-gray-200 text-gray-500 shadow-sm">
                  Developed by <strong className="text-[#128C7E] ml-1">J.V group</strong>
               </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
