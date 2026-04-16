# 🖨️ 3D Pixel Printing — Premium Dark Royal 3D Printing eCommerce

> India's #1 Premium 3D Printing Destination — Royal Blue & Gold on Deep Dark

---

## 🌐 Live Pages

| Page | URL |
|------|-----|
| Homepage | `index.html` |
| Shop / Products | `products.html` |
| Product Detail | `product.html?id={id}` |
| 3D Print Service | `print-service.html` |
| Cart | `cart.html` |
| Checkout | `checkout.html` |
| Customer Dashboard | `dashboard.html` |
| Services | `services.html` |
| Admin Panel | `admin.html` |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Royal Blue | `#1a3aff` |
| Gold | `#FFD700` |
| Background | `#0a0a0f` |
| Surface | `#0d0d1a` |
| Card | `#111128` |
| Fonts | Cinzel (display) · Orbitron (tech/mono) · Inter (body) |

All styles live in **`css/royal-theme.css`** (~2,800 lines).

---

## ✅ Completed Features

### Homepage (`index.html`) — Full Layout Spec v2
- **Top Announcement Bar** — Free Shipping · GST Billing · 24/7 Support · Coupon · Dispatch time (dismissable)
- **Sticky Header** — Logo · Search with suggestions · Nav links · Cart badge · Account · Admin · Hamburger
- **Scrolling Ticker Bar** — Seamless infinite scroll with offers
- **Hero Section** — Animated headline, "Shop Printers" + "Upload STL" CTAs, trust badges, animated counter stats, holographic 3D printer with orbiting dots, scan-line, floating info chips, progress bar animation
- **Featured Categories (5)** — 3D Printers · Filaments · Spare Parts · Custom Printing · Repair Services (with tags, hover glow, arrow)
- **Best Selling Products Grid** — 4-per-row, filter tabs (All / Printers / Filaments / Parts), hover glow + floating action buttons, animated entrance
- **STL Upload CTA Banner** — 4-step cards with scroll animations
- **How It Works (4 steps)** — Upload STL → Get Quote → We Print → Delivery (connected steps with icons, scroll-reveal)
- **Why Choose Us (8 points)** — Checkmark cards: Industrial Quality · Fast Delivery · Affordable Price · Technical Support · Authorized Dealer · GST Billing · Warranty · Eco Commitment
- **Testimonials Slider** — Auto-play 5s, prev/next, dot indicators, verified badges, overall rating summary with bars
- **Brands Bar** — Infinite scroll: Bambu Lab · Creality · Prusa · Elegoo · Anycubic · eSUN · Polymaker · SUNLU
- **Newsletter** — Email subscribe form + 4 perk cards
- **Footer** — Brand · Quick Links · Services · Contact Info (address, phone, email, hours, WhatsApp)
- **Cart Drawer** — Qty controls, remove, coupon codes (ROYAL10/PRINT15/SAVE20/FIRST25/MAKER30), GST calculation, checkout link
- **Live Chat Widget** — Quick replies, bot responses, badge notification
- **WhatsApp Float** — Direct chat link
- **Back to Top** — Scroll-triggered
- **Toast Notifications** — Typed (success/error/warning/info)

### Products Page (`products.html`)
- 24 products with filters, price slider, grid/list toggle, pagination

### Product Detail (`product.html`)
- Image gallery, specs table, EMI calculator (6 banks), reviews, related products

### 3D Print Service (`print-service.html`)
- Drag-&-drop STL upload, price calculator (9 materials), payment modal

### Cart (`cart.html`)
- 5 coupon codes, GST, shipping logic, upsells

### Checkout (`checkout.html`)
- 3-step flow — Razorpay / Stripe / UPI / COD

### Customer Dashboard (`dashboard.html`)
- Orders, tracking, STL files, wishlist, invoices, support tickets, profile

### Services (`services.html`)
- 4 services, AMC tiers ₹2,999–₹9,999

### Admin Panel (`admin.html`)
- Role-based login (admin@3dpixelprinting.in / Admin@2025)
- Chart.js analytics dashboard
- Order management, product management, user management
- Coupon management, payment tracking, STL manager, inventory alerts

---

## 📐 URL Parameters

| Page | Parameter | Example |
|------|-----------|---------|
| `products.html` | `?cat=printers` | Filter by category |
| `products.html` | `?search=bambu` | Search results |
| `product.html` | `?id=1` | Product by ID |

---

## 🛒 Mock Data

### Products (12 items)
Bambu Lab X1 Carbon, Creality K1 Max, Prusa MK4S, Elegoo Mars 4, Bambu P1S, Anycubic Photon M3, eSUN PLA+, Polymaker PolyTerra, Hatchbox PLA, Bambu AMS Lite, Creality Sprite Extruder, Micro Swiss Hotend

### Coupon Codes
`ROYAL10` (10%) · `PRINT15` (15%) · `SAVE20` (20%) · `FIRST25` (25%) · `MAKER30` (30%)

### Admin Credentials
Email: `admin@3dpixelprinting.in` | Password: `Admin@2025` *(demo only)*

---

## 🏗️ Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | HTML5 · CSS3 · Vanilla JavaScript (ES6+) |
| Styling | Custom Design System (`css/royal-theme.css`) |
| Icons | Font Awesome 6.4.0 (CDN) |
| Fonts | Google Fonts — Cinzel · Orbitron · Inter |
| Charts | Chart.js (admin dashboard) |
| Payments | Razorpay + Stripe (UI mockup) |
| Backend | Firebase (planned integration) |

---

## 🚀 Deployment

Click the **Publish** tab to deploy the site live. All assets are self-contained static files.

---

## 📋 Pending / Roadmap

- [ ] Firebase Auth & Firestore integration
- [ ] Real Razorpay SDK order creation
- [ ] Real Stripe Checkout session
- [ ] STL file processing & slicing backend
- [ ] Email notifications (order confirmation, shipping)
- [ ] WhatsApp Business API integration
- [ ] About Us page
- [ ] Blog / 3D Printing Tips page
- [ ] Advanced product search with Algolia
- [ ] PWA (Progressive Web App) manifest

---

*© 2025 3D Pixel Printing Technologies Pvt. Ltd. — Built with 💙 and ✨*
