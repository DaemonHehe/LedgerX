import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import { ArrowRight, Sparkles, LayoutTemplate, Database, Check } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FEATURES = [
  {
    icon: <LayoutTemplate size={24} className="mb-4 text-[var(--accent-red)]" />,
    title: 'Template Studio',
    description: 'Figma-like canvas to design pixel-perfect layouts. Stop guessing with HTML/CSS.',
  },
  {
    icon: <Sparkles size={24} className="mb-4 text-[var(--accent-red)]" />,
    title: 'AI Import',
    description: 'Upload a physical receipt. AI converts it into an editable JSON template instantly.',
  },
  {
    icon: <Database size={24} className="mb-4 text-[var(--accent-red)]" />,
    title: 'Sales Ledger',
    description: 'Auto-saving database with a spreadsheet interface. Never lose a record.',
  },
];

// Reusable text reveal animation
const textRevealVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
      delay: i * 0.1,
    },
  }),
};

// Reusable stagger container
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 15, stiffness: 80 },
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);

  const goToAuth = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white overflow-x-hidden selection:bg-[var(--accent-red)] selection:text-white pb-0">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 w-full z-50 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--line)]"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 rounded-none" />
            <span className="font-mono text-sm font-bold tracking-tight uppercase">
              LedgerX
            </span>
          </div>
          <button
            type="button"
            onClick={goToAuth}
            className="border border-[var(--line)] hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors rounded-none px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            Sign In
          </button>
        </div>
      </motion.nav>

      {/* 1. ATTENTION (Hero) */}
      <section className="relative pt-40 pb-20 px-6 max-w-5xl mx-auto text-center overflow-hidden">
        
        {/* Subtle background glow effect behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-red)]/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          style={{ y: yHero }}
          className="relative z-10"
        >
          <motion.div 
            custom={0} initial="hidden" animate="visible" variants={textRevealVariants}
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--accent-red)] text-[var(--accent-red)] text-xs font-mono uppercase tracking-widest bg-[var(--accent-red)]/10 relative overflow-hidden group"
          >
            <span className="w-2 h-2 bg-[var(--accent-red)] rounded-full animate-pulse"></span>
            LedgerX Pro is live
            
            {/* Reactbits-style shiny sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              initial={{ x: '-150%' }}
              animate={{ x: '150%' }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1, ease: 'linear' }}
            />
          </motion.div>
          
          <motion.h1 
            custom={1} initial="hidden" animate="visible" variants={textRevealVariants}
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-none"
          >
            RECEIPTS. <br />
            <span className="text-[var(--ink-soft)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--ink-soft)] to-white">
              ZERO FRICTION.
            </span>
          </motion.h1>
          
          <motion.p 
            custom={2} initial="hidden" animate="visible" variants={textRevealVariants}
            className="text-lg md:text-xl text-[var(--ink-soft)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Stop wrestling with code to generate PDFs. Design pixel-perfect templates visually and generate dynamic receipts via API in seconds.
          </motion.p>
          
          <motion.div 
            custom={3} initial="hidden" animate="visible" variants={textRevealVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={goToAuth}
              className="group relative flex items-center justify-center gap-3 bg-white text-black px-8 py-4 w-full sm:w-auto hover:bg-[var(--accent-red)] hover:text-white transition-all duration-300 font-mono font-bold tracking-widest uppercase text-sm border-2 border-white hover:border-[var(--accent-red)] overflow-hidden"
            >
              Start Creating
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. INTEREST (Features) */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-secondary)] overflow-hidden relative">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
            {FEATURES.map((feature, idx) => (
              <motion.div 
                key={feature.title} 
                variants={itemVariants}
                whileHover={{ y: -5, backgroundColor: 'var(--bg-tertiary)' }}
                className="p-10 transition-colors"
              >
                {feature.icon}
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-[var(--ink-soft)] leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. DESIRE (Social Proof / Benefits) */}
      <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 uppercase">
              Reverse Engineer<br />The Physical World.
            </h2>
            <p className="text-[var(--ink-soft)] mb-8 text-lg leading-relaxed">
              Have a paper receipt you love? Take a picture. Our AI instantly analyzes the layout and recreates it as a dynamic, editable JSON template. No CSS required.
            </p>
            <ul className="space-y-4 mb-10">
              {['Pixel-perfect rendering', 'Dynamic data substitution', 'Instant PNG export', 'Centralized sales ledger'].map((item, i) => (
                <motion.li 
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3 text-sm font-mono text-[var(--ink-soft)]"
                >
                  <Check size={16} className="text-[var(--accent-red)]" />
                  {item}
                </motion.li>
              ))}
            </ul>
            <button
              onClick={goToAuth}
              className="border border-[var(--line)] hover:border-[var(--accent-red)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
            >
              See It In Action
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative aspect-square bg-[var(--bg-tertiary)] border border-[var(--line)] p-8 overflow-hidden group"
          >
            {/* Abstract visual representing AI mapping */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            {/* Scanning Laser Animation */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent-red)]/80 shadow-[0_0_15px_var(--accent-red)]"
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-[var(--accent-red)]/30 group-hover:border-[var(--accent-red)] transition-colors duration-700 flex items-center justify-center">
              <div className="w-1/2 h-1/2 border border-white/20 relative">
                <motion.div 
                  className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--accent-red)]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--accent-red)]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
            
            <motion.div 
              className="absolute bottom-4 left-4 font-mono text-[10px] text-[var(--ink-soft)] tracking-widest uppercase"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {'>'} analyzing_layout...
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. ACTION (Final CTA) */}
      <section className="relative border-t border-[var(--line)] bg-[var(--accent-red)] text-white py-32 px-6 text-center overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px] opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            READY TO UPGRADE?
          </h2>
          <p className="text-white/90 max-w-xl mx-auto mb-10 text-lg">
            Join professional developers generating thousands of beautiful documents effortlessly. Create an account to access our Pro plans.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToAuth}
            className="bg-black text-white px-10 py-4 font-mono font-bold tracking-widest uppercase text-sm shadow-xl"
          >
            Create Account
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 px-6 text-center">
        <p className="font-mono text-xs text-[var(--ink-soft)] uppercase tracking-widest">
          © {new Date().getFullYear()} LedgerX System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
