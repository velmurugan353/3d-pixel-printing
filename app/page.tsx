'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ─── MOCK DATA ─────────────────────────────────────────────────────── */
const testimonials = [
  {
    name: "Vikram Malhotra",
    role: "Industrial Designer",
    initial: "V",
    rating: 5,
    text: "3D Pixel Printing has been our go-to for rapid prototyping. Their turnaround time is unmatched in India, and the precision of their industrial prints is top-tier.",
    verified: true
  },
  {
    name: "Ananya Sharma",
    role: "Creative Artist",
    initial: "A",
    rating: 5,
    text: "The exotic filaments I bought from here are just amazing! The wood and marble finish PLA worked perfectly for my art project. Highly recommended.",
    verified: true
  },
  {
    name: "Rohan Das",
    role: "Tech Enthusiast",
    initial: "R",
    rating: 4,
    text: "Great experience with their repair service. My Creality printer had some motherboard issues, and they fixed it at my doorstep within 24 hours.",
    verified: true
  },
  {
    name: "Sneha Reddy",
    role: "Architecture Student",
    initial: "S",
    rating: 5,
    text: "Best 3D printing service in Bengaluru. I uploaded my CAD model and got an instant quote. The final print quality was way better than I expected.",
    verified: true
  },
  {
    name: "Pratik Jain",
    role: "B2B Client",
    initial: "P",
    rating: 5,
    text: "Their AMC plans are perfect for our university's maker space. Maintenance is hassle-free and the technical support is very responsive.",
    verified: true
  }
];

const brands = [
  "BAMBU LAB", "CREALITY", "PRUSA", "ELEGOO", "ANYCUBIC", "ESUN", "POLYMAKER", "SUNLU"
];

/* ─── COMPONENTS ────────────────────────────────────────────────────── */

function StarRating({ rating }) {
  return (
    <div className="product-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star ${i <= Math.floor(rating) ? '' : 'empty'}`}>★</span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponInput, setCouponInput] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "👋 Hi! Welcome to 3D Pixel Printing. How can I help you today?", type: 'bot' },
    { text: "Ask about products, pricing, orders, or services!", type: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [stats, setStats] = useState({ printers: 0, customers: 0, prints: 0, rating: 0 });
  const [printPct, setPrintPct] = useState(74);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchMobileVisible, setIsSearchMobileVisible] = useState(false);

  const heroParticlesRef = useRef(null);

  /* ─── HELPERS ──────────────────────────────────────────────────────── */
  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const updateCartCount = () => cartItems.reduce((s, i) => s + i.qty, 0);

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst - couponDiscount;
    return { subtotal, gst, total };
  };

  /* ─── ACTIONS ──────────────────────────────────────────────────────── */
  const addToCart = (p) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === p._id);
      if (existing) {
        return prev.map(item => item.id === p._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: p._id, name: p.name, price: p.price, qty: 1, emoji: p.emoji, imageId: (p.imageIds && p.imageIds[0]) }];
    });
    showToast(`✅ ${p.name} added to cart!`, 'success');
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    showToast('Item removed from cart', 'info');
  };

  const updateQty = (id, delta) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const applyCoupon = () => {
    const code = couponInput.toUpperCase().trim();
    const coupons = { ROYAL10: 0.10, PRINT15: 0.15, SAVE20: 0.20, FIRST25: 0.25, MAKER30: 0.30 };
    if (coupons[code]) {
      const sub = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
      setCouponDiscount(Math.round(sub * coupons[code]));
      showToast(`🎉 Coupon applied!`, 'success');
    } else {
      showToast('❌ Invalid coupon code', 'error');
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { text: chatInput, type: 'user' }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: "Thanks for reaching out! Our team will connect with you shortly.", type: 'bot' }]);
    }, 800);
  };

  /* ─── EFFECTS ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setFeaturedProducts(data);
        setFilteredProducts(data.slice(0, 8));
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchProducts();

    // Stats animation
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStats({
        printers: Math.floor((5200 / steps) * step),
        customers: Math.floor((12400 / steps) * step),
        prints: Math.floor((48000 / steps) * step),
        rating: Number(((4.9 / steps) * step).toFixed(1))
      });
      if (step >= steps) {
        clearInterval(timer);
        setStats({ printers: 5200, customers: 12400, prints: 48000, rating: 4.9 });
      }
    }, interval);

    // Scroll handlers
    const handleScroll = () => {
      setIsNavbarScrolled(window.scrollY > 60);
      setIsBackToTopVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    // Particles
    if (heroParticlesRef.current) {
      for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
          left:${Math.random() * 100}%;
          top:${Math.random() * 100}%;
          width:${2 + Math.random() * 4}px;
          height:${2 + Math.random() * 4}px;
          animation-delay:${Math.random() * 6}s;
          animation-duration:${4 + Math.random() * 8}s;
        `;
        heroParticlesRef.current.appendChild(p);
      }
    }

    // Printer animation
    const printTimer = setInterval(() => {
      setPrintPct(prev => (prev + 0.1) % 100);
    }, 80);

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(printTimer);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSlidesPerView(1);
      else if (window.innerWidth < 1100) setSlidesPerView(2);
      else setSlidesPerView(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let list = activeFilter === 'all' 
      ? featuredProducts 
      : featuredProducts.filter(p => {
          const cat = (p.category || '').toLowerCase();
          if (activeFilter === 'printers') return cat.includes('printer');
          if (activeFilter === 'filaments') return cat.includes('filament');
          if (activeFilter === 'parts') return cat.includes('part') || cat.includes('accessory');
          return false;
        });
    setFilteredProducts(list.slice(0, 8));
  }, [activeFilter, featuredProducts]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const results = featuredProducts
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
    setSearchSuggestions(results);
  }, [searchQuery, featuredProducts]);

  const { subtotal, gst, total } = calculateTotals();

  return (
    <div className="royal-theme">
      {/* ═══════════════════════════════════════════════════════════
           TOP ANNOUNCEMENT BAR
      ═══════════════════════════════════════════════════════════ */}
      {isAnnouncementVisible && (
        <div className="announcement-bar">
          <div className="announcement-inner">
            <div className="announcement-items">
              <div className="announcement-item">
                <i className="fas fa-shipping-fast announcement-icon"></i>
                <span><strong>Free Shipping</strong> on orders above ₹2,999</span>
              </div>
              <div className="announcement-divider">|</div>
              <div className="announcement-item">
                <i className="fas fa-file-invoice announcement-icon"></i>
                <span><strong>GST Billing</strong> available for all orders</span>
              </div>
              <div className="announcement-divider">|</div>
              <div className="announcement-item">
                <i className="fas fa-headset announcement-icon"></i>
                <span><strong>24/7 Support</strong> via WhatsApp & Live Chat</span>
              </div>
            </div>
            <button className="announcement-close" onClick={() => setIsAnnouncementVisible(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           HEADER / NAVIGATION
      ═══════════════════════════════════════════════════════════ */}
      <header className="site-header" style={{ top: isAnnouncementVisible ? '40px' : '0' }}>
        <nav className={`navbar ${isNavbarScrolled ? 'scrolled' : ''}`}>
          <div className="container">
            <div className="navbar-inner">
              <Link href="/" className="navbar-logo">
                <div className="logo-icon">🖨️</div>
                <div className="logo-text">3D Pixel <span>Printing</span></div>
              </Link>

              <div className={`navbar-search ${isSearchMobileVisible ? 'mobile-visible' : ''}`}>
                <div className="search-wrapper">
                  <i className="fas fa-search search-icon"></i>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search printers, filaments, parts…" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-btn">Search</button>
                </div>
                {searchSuggestions.length > 0 && (
                  <div className="search-suggestions" style={{ display: 'block' }}>
                    {searchSuggestions.map(s => (
                      <Link key={s._id} href={`/product.html?id=${s._id}`} className="search-sug-item">
                        {s.emoji} {s.name} — ₹{s.price.toLocaleString('en-IN')}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <nav className="navbar-nav">
                <Link href="/" className="nav-link active">Home</Link>
                <Link href="/products.html" className="nav-link">Shop</Link>
                <Link href="/services.html" className="nav-link">Services</Link>
                <Link href="/print-service.html" className="nav-link">3D Print</Link>
                <a href="#contact" className="nav-link">Contact</a>
              </nav>

              <div className="navbar-actions">
                <button className="nav-action-btn" onClick={() => setIsSearchMobileVisible(!isSearchMobileVisible)}>
                  <i className="fas fa-search"></i>
                </button>
                <button className="nav-action-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                  <i className="fas fa-shopping-cart"></i>
                  <span className="cart-count">{updateCartCount()}</span>
                </button>
                <Link href="/dashboard.html" className="nav-action-btn">
                  <i className="fas fa-user"></i>
                </Link>
                <Link href="/admin.html" className="btn btn-outline btn-sm admin-btn">
                  <i className="fas fa-shield-alt"></i><span> Admin</span>
                </Link>
                <button className="hamburger" onClick={() => setIsMobileMenuOpen(true)}>
                  <span></span><span></span><span></span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div className="mobile-menu-logo">
          <div className="logo-icon">🖨️</div>
          <div className="logo-text">3D Pixel <span>Printing</span></div>
        </div>
        <nav className="mobile-nav">
          <Link href="/" className="mobile-nav-link active" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-home"></i>Home</Link>
          <Link href="/products.html" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-box"></i>Shop Products</Link>
          <Link href="/services.html" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-cogs"></i>Services</Link>
          <Link href="/print-service.html" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-print"></i>3D Print Service</Link>
        </nav>
      </div>
      {isMobileMenuOpen && <div className="mobile-overlay active" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Ticker */}
      <div className="ticker-bar">
        <div className="ticker-track">
          <div className="ticker-items">
            {[1, 2].map(i => (
              <React.Fragment key={i}>
                <span className="ticker-item"><span className="ticker-dot"></span>🚀 Free Shipping on orders above <strong>₹2,999</strong></span>
                <span className="ticker-item"><span className="ticker-dot"></span>⚡ Same-day dispatch before 2 PM</span>
                <span className="ticker-item"><span className="ticker-dot"></span>🎁 Code <strong>ROYAL10</strong> — 10% off</span>
                <span className="ticker-item"><span className="ticker-dot"></span>🛠️ Professional 3D Printing from <strong>₹199</strong></span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-bg-layer"></div>
        <div className="hero-grid-layer"></div>
        <div className="hero-particles" ref={heroParticlesRef}></div>
        
        <div className="glow-orb orb-blue" style={{ width: '700px', height: '700px', top: '-150px', left: '-150px', opacity: 0.35 }}></div>
        <div className="glow-orb orb-gold" style={{ width: '500px', height: '500px', bottom: '-50px', right: '5%', opacity: 0.25 }}></div>

        <div className="container hero-container">
          <div className="hero-content animate-fade-in">
            <div className="hero-badge">
              <span className="badge-pulse"></span>
              <i className="fas fa-crown"></i> India's #1 Premium 3D Printing Destination
            </div>
            <h1 className="hero-title">
              Next Generation<br />
              <span className="text-gradient-royal">3D Printing</span><br />
              <span className="text-gradient-gold">Solutions</span>
            </h1>
            <p className="hero-subtitle">
              Premium printers, exotic filaments, expert print services, doorstep repairs & CAD design — all under one royal roof. Trusted by <strong>10,000+</strong> makers across India.
            </p>
            <div className="hero-actions">
              <Link href="/products.html" className="btn btn-gold btn-xl hero-btn-primary">
                <i className="fas fa-store"></i> Shop Printers
              </Link>
              <Link href="/print-service.html" className="btn btn-outline btn-xl hero-btn-secondary">
                <i className="fas fa-upload"></i> Upload STL
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">{stats.printers.toLocaleString()}+</div>
                <div className="hero-stat-label">Printers Sold</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="hero-stat-number">{stats.customers.toLocaleString()}+</div>
                <div className="hero-stat-label">Happy Customers</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="hero-stat-number">{stats.prints.toLocaleString()}+</div>
                <div className="hero-stat-label">Prints Delivered</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <div className="hero-stat-number">{stats.rating}★</div>
                <div className="hero-stat-label">Star Rating</div>
              </div>
            </div>
          </div>

          <div className="hero-visual animate-fade-in-right">
            <div className="printer-3d-scene">
              <div className="printer-platform"></div>
              <div className="holo-ring holo-ring-1"></div>
              <div className="holo-ring holo-ring-2"></div>
              <div className="printer-core">
                <div className="printer-body">
                  <div className="printer-emoji">🖨️</div>
                  <div className="print-progress-bar">
                    <div className="print-progress-fill" style={{ width: `${printPct}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="info-chip info-chip-br">
                <div className="chip-status">
                  <span className="status-dot"></span>
                  <span className="text-success font-tech">PRINTING</span>
                </div>
                <div className="chip-sub">Progress: {Math.round(printPct)}%</div>
              </div>
              <div className="scan-line"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
           CATEGORIES
      ═══════════════════════════════════════════════════════════ */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><i className="fas fa-th-large"></i> Browse Categories</div>
            <h2 className="section-title">Shop by <span className="text-gradient-royal">Category</span></h2>
          </div>
          <div className="categories-grid">
            {[
              { name: "3D Printers", emoji: "🖨️", count: "48 Products", link: "/products.html?cat=printers" },
              { name: "Filaments", emoji: "🧵", count: "120+ Colors", link: "/products.html?cat=filaments" },
              { name: "Spare Parts", emoji: "⚙️", count: "300+ Parts", link: "/products.html?cat=parts" },
              { name: "Custom Printing", emoji: "📐", count: "From ₹199", link: "/print-service.html" },
              { name: "Repair Services", emoji: "🔧", count: "Expert Technicians", link: "/services.html#repair" },
              { name: "2D to 3D Magic", emoji: "🎨", count: "Photos to 3D", link: "/2d-to-3d.html" }
            ].map(cat => (
              <Link key={cat.name} href={cat.link} className="category-card in-view">
                <div className="category-glow"></div>
                <div className="category-icon-wrap"><div className="category-icon">{cat.emoji}</div></div>
                <div className="category-info">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.count}</div>
                  <div className="category-arrow"><i className="fas fa-arrow-right"></i></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
           PRODUCTS GRID
      ═══════════════════════════════════════════════════════════ */}
      <section className="products-section section">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><i className="fas fa-fire"></i> Hot Picks</div>
            <h2 className="section-title">Best <span className="text-gradient-gold">Selling Products</span></h2>
          </div>

          <div className="filter-tabs">
            {['all', 'printers', 'filaments', 'parts'].map(f => (
              <button key={f} className={`filter-tab ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                {f === 'all' ? <i className="fas fa-th"></i> : f === 'printers' ? <i className="fas fa-print"></i> : f === 'filaments' ? <i className="fas fa-layer-group"></i> : <i className="fas fa-cog"></i>}
                {f.charAt(0).toUpperCase() + f.slice(1)} Products
              </button>
            ))}
          </div>

          <div className="products-grid">
            {filteredProducts.map(p => (
              <div key={p._id} className="product-card in-view">
                <div className="product-card-img" onClick={() => window.location.href = `/product.html?id=${p._id}`}>
                  {p.imageIds && p.imageIds.length > 0 ? (
                    <img src={`/api/image/${p.imageIds[0]._id || p.imageIds[0]}`} alt={p.name} className="product-full-img" />
                  ) : p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="product-full-img" />
                  ) : (
                    <div className="product-emoji-wrap">{p.emoji || '📦'}</div>
                  )}
                  <div className="product-glow-overlay"></div>
                  <div className="product-card-actions">
                    <button className="pca-btn" onClick={(e) => { e.stopPropagation(); addToCart(p); }}><i className="fas fa-cart-plus"></i></button>
                    <button className="pca-btn" onClick={(e) => { e.stopPropagation(); showToast('❤️ Added to Wishlist', 'success'); }}><i className="far fa-heart"></i></button>
                  </div>
                </div>
                <div className="product-card-body">
                  <div className="product-brand">{p.brand}</div>
                  <h3 className="product-name">{p.name}</h3>
                  <div className="product-rating">
                    <StarRating rating={p.rating} />
                    <span className="product-rating-text">{p.rating} <span style={{ color: 'var(--text-muted)' }}>({p.reviews})</span></span>
                  </div>
                  <div className="product-price-row">
                    <span className="product-price">₹{p.price.toLocaleString('en-IN')}</span>
                    {p.original && <span className="product-price-old">₹{p.original.toLocaleString('en-IN')}</span>}
                  </div>
                  <div className="product-card-footer">
                    <button className="btn btn-royal btn-sm product-add-btn" onClick={() => addToCart(p)}>
                      <i className="fas fa-cart-plus"></i> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
           HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section className="how-it-works section">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><i className="fas fa-route"></i> Simple Process</div>
            <h2 className="section-title">How It <span className="text-gradient-royal">Works</span></h2>
          </div>
          <div className="how-steps">
            {[
              { step: "01", title: "Upload STL", desc: "Upload your 3D model in STL, OBJ, or 3MF format.", icon: "fa-upload" },
              { step: "02", title: "Get Quote", desc: "Instantly see pricing based on your material choice.", icon: "fa-file-invoice-dollar" },
              { step: "03", title: "We Print", desc: "Our industrial printers produce your part with precision.", icon: "fa-print" },
              { step: "04", title: "Delivery", desc: "Packed safely and dispatched via premium courier.", icon: "fa-truck" }
            ].map((s, idx) => (
              <div key={s.step} className="how-step in-view" data-step={idx + 1}>
                <div className="step-circle">
                  <div className="step-number">{s.step}</div>
                  <div className="step-icon-wrap"><i className={`fas ${s.icon} step-fa-icon`}></i></div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
           TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section className="testimonials-section section">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><i className="fas fa-heart"></i> Customer Love</div>
            <h2 className="section-title">What Our <span className="text-gradient-royal">Customers Say</span></h2>
          </div>
          <div className="testimonials-slider-wrap">
            <button className="slider-nav-btn slider-prev" onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="testimonials-slider">
              <div className="testimonials-track" style={{ transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)` }}>
                {testimonials.map((t, idx) => (
                  <div key={idx} className="testimonial-slide" style={{ flex: `0 0 ${100 / slidesPerView}%` }}>
                    <div className="testimonial-card">
                      <div className="tc-top">
                        <div className="tc-quote">"</div>
                        <StarRating rating={t.rating} />
                      </div>
                      <p className="tc-text">{t.text}</p>
                      <div className="tc-author">
                        <div className="tc-avatar">{t.initial}</div>
                        <div className="tc-info">
                          <div className="tc-name">{t.name}</div>
                          <div className="tc-role">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="slider-nav-btn slider-next" onClick={() => setCurrentSlide(prev => Math.min(Math.ceil(testimonials.length / slidesPerView) - 1, prev + 1))}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Brands Bar */}
      <section className="brands-section">
        <div className="container">
          <p className="brands-label">Authorized Dealer For</p>
          <div className="brands-track">
            <div className="brands-items">
              {[...brands, ...brands].map((b, idx) => (
                <span key={idx} className="brand-logo">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-bg"></div>
        <div className="container">
          <div className="newsletter-inner">
            <div className="newsletter-content">
              <h2 className="newsletter-title">Get Exclusive <span className="text-gradient-gold">Royal Deals</span></h2>
              <div className="newsletter-form">
                <input type="email" className="newsletter-input" placeholder="your@email.com" />
                <button className="btn btn-gold newsletter-btn" onClick={() => showToast('🎉 Subscribed!', 'success')}>Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
           FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="site-footer" id="contact">
        <div className="footer-top">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="logo-icon">🖨️</div>
                  <div className="logo-text">3D Pixel <span>Printing</span></div>
                </div>
                <p className="footer-brand-desc">India's most premium 3D printing destination.</p>
              </div>
              <div className="footer-col">
                <div className="footer-col-title">Quick Links</div>
                <nav className="footer-links">
                  <Link href="/products.html" className="footer-link">Shop Products</Link>
                  <Link href="/print-service.html" className="footer-link">3D Print Service</Link>
                  <Link href="/services.html" className="footer-link">All Services</Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
           CART DRAWER
      ═══════════════════════════════════════════════════════════ */}
      <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={() => setIsCartOpen(false)}></div>
      <aside className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <div>
            <h3 className="cart-drawer-title"><i className="fas fa-shopping-cart"></i> Shopping Cart</h3>
            <p className="cart-drawer-count">{cartItems.length} items</p>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="cart-close-btn"><i className="fas fa-times"></i></button>
        </div>
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">Your cart is empty</div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-thumb">{item.emoji}</div>
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price price-gold">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                  <div className="cart-item-qty-row">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-totals">
            <div className="cart-total-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="cart-total-row total-row"><span>Total</span><span className="price-gold">₹{total.toLocaleString('en-IN')}</span></div>
          </div>
          <Link href="/checkout.html" className="btn btn-gold w-full">Secure Checkout</Link>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
           LIVE CHAT
      ═══════════════════════════════════════════════════════════ */}
      <div className="chat-widget">
        <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
          <div className="chat-window-header">
            <div className="chat-header-info">
              <div className="chat-header-name">3D Pixel Printing Support</div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="chat-close-btn"><i className="fas fa-times"></i></button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.type}`}>{m.text}</div>
            ))}
          </div>
          <div className="chat-input-area">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Type message…" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChat()}
            />
            <button className="btn btn-royal btn-icon" onClick={sendChat}><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
        <button className="chat-toggle-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
          <i className="fas fa-comments"></i>
        </button>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.msg}</span>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>

      {/* Back to Top */}
      {isBackToTopVisible && (
        <button className="back-to-top visible" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* WhatsApp Float */}
      <a href="https://wa.me/919876543210" className="whatsapp-float" target="_blank" rel="noopener">
        <i className="fab fa-whatsapp"></i>
      </a>
    </div>
  );
}
