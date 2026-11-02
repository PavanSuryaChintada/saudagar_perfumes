import React, { useState } from 'react';

export default function Footer({ onSelectCategory, onNavigateHome }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer id="footer-section" className="bg-[#0A0A0C] text-[#D4AF37] border-t border-[#D4AF37]/30 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-14 border-b border-[#D4AF37]/20 text-xs tracking-[0.14em]">
          
          {/* Column 1: Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/25 pb-2">
              Information
            </h4>
            <ul className="space-y-2.5 text-white/75 text-[11px] uppercase tracking-[0.16em]">
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); alert('FAQ:\n• Extrait de Parfum concentration 35%+.\n• Average longevity 12-16+ hours.\n• 100% pure botanical & oriental essences.'); }} className="hover:text-[#D4AF37] transition-colors">FAQ</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); alert('Saudagar Concierge:\nWhatsApp: +971 54 247 7037\nEmail: concierge@saudagarperfumes.com'); }} className="hover:text-[#D4AF37] transition-colors">Contact Us</a></li>
              <li><a href="#careers" onClick={(e) => { e.preventDefault(); alert('Careers:\nSend your CV and portfolio to careers@saudagarperfumes.com'); }} className="hover:text-[#D4AF37] transition-colors">Careers</a></li>
              <li><a href="#shipping" onClick={(e) => { e.preventDefault(); alert('Shipping Policy:\n• Complimentary UAE delivery on orders above AED 250.\n• International DHL Express insured delivery worldwide.'); }} className="hover:text-[#D4AF37] transition-colors">Shipping and Return</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Handcrafted in Dubai under UAE luxury cosmetic regulations.'); }} className="hover:text-[#D4AF37] transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All customer information is strictly encrypted.'); }} className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
              <li><a href="#distributors" onClick={(e) => { e.preventDefault(); alert('Global Distributors: Contact wholesale@saudagarperfumes.com'); }} className="hover:text-[#D4AF37] transition-colors">Distributors</a></li>
            </ul>
          </div>

          {/* Column 2: Our Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/25 pb-2">
              Our Services
            </h4>
            <ul className="space-y-2.5 text-white/75 text-[11px] uppercase tracking-[0.16em]">
              <li><a href="#franchise" onClick={(e) => { e.preventDefault(); alert('Franchising: Global retail partnership opportunities in London, Paris, Riyadh, and New York.'); }} className="hover:text-[#D4AF37] transition-colors">Franchise</a></li>
              <li><a href="#private-label" onClick={(e) => { e.preventDefault(); alert('Private Labelling: Turnkey bespoke perfume creation for royal palaces, luxury hotels and high-jewelry houses.'); }} className="hover:text-[#D4AF37] transition-colors">Private Labeling</a></li>
              <li><a href="#bespoke" onClick={(e) => { e.preventDefault(); const el = document.getElementById('create-fragrance-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors font-bold text-[#D4AF37]">BeSpoke Experience</a></li>
              <li><a href="#workshops" onClick={(e) => { e.preventDefault(); alert('Masterclass Workshops: Weekend bespoke formulation in our Al Fahidi atelier.'); }} className="hover:text-[#D4AF37] transition-colors">Workshops</a></li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/25 pb-2">
              Contact Us
            </h4>
            <div className="space-y-2.5 text-white/75 text-[11px] leading-relaxed">
              <p className="font-semibold text-[#D4AF37]">
                Store Locations:
              </p>
              <p>Al Fahidi Historical District, Bur Dubai, UAE</p>
              <p>Grand Atrium, Gold Souk Extension, Deira Dubai</p>
              <div className="pt-2 space-y-1">
                <p>
                  WhatsApp: <a href="https://wa.me/971542477037" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#D4AF37]">+971 (54) 247 7037</a>
                </p>
                <p>
                  Call: <a href="tel:97143422336" className="text-white hover:underline">+971 (04) 342 2336</a>
                </p>
                <p>
                  Email: <a href="mailto:concierge@saudagarperfumes.com" className="text-white hover:underline">concierge@saudagarperfumes.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/25 pb-2">
              Newsletter
            </h4>
            <p className="text-[11px] text-white/70 leading-relaxed font-light">
              Sign up to receive private invitations to limited-edition batch harvests and bespoke events.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-MAIL"
                className="w-full bg-[#141418] border border-[#D4AF37]/40 px-3.5 py-3 text-xs text-white placeholder-white/40 tracking-[0.18em] uppercase focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="w-full bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#ECC86A] text-xs font-bold uppercase tracking-[0.22em] py-3 transition-all duration-300 shadow-xl"
              >
                {subscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>

        </div>

        {/* Floating Glassmorphism Social Media Pill in Black & Gold */}
        <div className="flex justify-center my-8">
          <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-[#141418]/90 backdrop-blur-md border border-[#D4AF37]/35 shadow-2xl text-[#D4AF37]">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-white hover:scale-110 transition-all"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.183 21.85v-8.868H7.2V9.526h2.983V6.982a4.17 4.17 0 0 1 4.44-4.572 22.33 22.33 0 0 1 2.667.144v3.084h-1.83a1.44 1.44 0 0 0-1.713 1.68v2.208h3.423l-.447 3.456h-2.97v8.868h-3.57Z" />
              </svg>
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-white hover:scale-110 transition-all"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.4c-2.607 0-2.934.011-3.958.058-1.022.046-1.72.209-2.33.446a4.705 4.705 0 0 0-1.7 1.107 4.706 4.706 0 0 0-1.108 1.7c-.237.611-.4 1.31-.446 2.331C2.41 9.066 2.4 9.392 2.4 12c0 2.607.011 2.934.058 3.958.046 1.022.209 1.72.446 2.33a4.706 4.706 0 0 0 1.107 1.7c.534.535 1.07.863 1.7 1.108.611.237 1.309.4 2.33.446 1.025.047 1.352.058 3.959.058s2.934-.011 3.958-.058c1.022-.046 1.72-.209 2.33-.446a4.706 4.706 0 0 0 1.7-1.107 4.706 4.706 0 0 0 1.108-1.7c.237-.611.4-1.31.446-2.33.047-1.025.058-1.352.058-3.959s-.011-2.934-.058-3.958c-.047-1.022-.209-1.72-.446-2.33a4.706 4.706 0 0 0-1.107-1.7 4.705 4.705 0 0 0-1.7-1.108c-.611-.237-1.31-.4-2.331-.446C14.934 2.41 14.608 2.4 12 2.4Zm0 1.73c2.563 0 2.867.01 3.88.056.935.042 1.443.199 1.782.33.448.174.768.382 1.104.718.336.336.544.656.718 1.104.131.338.287.847.33 1.783.046 1.012.056 1.316.056 3.879 0 2.563-.01 2.867-.056 3.88-.043.935-.199 1.444-.33 1.782a2.974 2.974 0 0 1-.719 1.104 2.974 2.974 0 0 1-1.103.718c-.339.131-.847.288-1.783.33-1.012.046-1.316.056-3.88.056-2.563 0-2.866-.01-3.878-.056-.936-.042-1.445-.199-1.783-.33a2.974 2.974 0 0 1-1.104-.718 2.974 2.974 0 0 1-.718-1.104c-.131-.338-.288-.847-.33-1.783-.047-1.012-.056-1.316-.056-3.879 0-2.563.01-2.867.056-3.88.042-.935.199-1.443.33-1.782.174-.448.382-.768.718-1.104a2.974 2.974 0 0 1 1.104-.718c.338-.131.847-.288 1.783-.33C9.133 4.14 9.437 4.13 12 4.13Zm0 11.07a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm0-8.13a4.93 4.93 0 1 0 0 9.86 4.93 4.93 0 0 0 0-9.86Zm6.276-.194a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0Z" />
              </svg>
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-white hover:scale-110 transition-all"
              aria-label="YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.44 5.243c.929.244 1.66.963 1.909 1.876.451 1.654.451 5.106.451 5.106s0 3.452-.451 5.106a2.681 2.681 0 0 1-1.91 1.876c-1.684.443-8.439.443-8.439.443s-6.754 0-8.439-.443a2.682 2.682 0 0 1-1.91-1.876c-.45-1.654-.45-5.106-.45-5.106s0-3.452.45-5.106a2.681 2.681 0 0 1 1.91-1.876c1.685-.443 8.44-.443 8.44-.443s6.754 0 8.438.443Zm-5.004 6.982L9.792 15.36V9.091l5.646 3.134Z" />
              </svg>
            </a>

            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-white hover:scale-110 transition-all"
              aria-label="TikTok"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.027 10.168a5.125 5.125 0 0 1-4.76-2.294v7.893a5.833 5.833 0 1 1-5.834-5.834c.122 0 .241.011.361.019v2.874c-.12-.014-.237-.036-.36-.036a2.977 2.977 0 0 0 0 5.954c1.644 0 3.096-1.295 3.096-2.94L12.56 2.4h2.75a5.122 5.122 0 0 0 4.72 4.573v3.195" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[10px] tracking-[0.18em] uppercase text-white/50">
          <div>
            © {new Date().getFullYear()} SAUDAGAR PERFUMES · OFFICIAL ONLINE STORE. ALL RIGHTS RESERVED.
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            <span className="bg-[#141418] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold text-[#D4AF37]">VISA</span>
            <span className="bg-[#141418] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold text-[#D4AF37]">MASTERCARD</span>
            <span className="bg-[#141418] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold text-[#D4AF37]">AMEX</span>
            <span className="bg-[#141418] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold text-[#D4AF37]">APPLE PAY</span>
            <span className="bg-[#141418] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold text-[#D4AF37]">TABBY</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
