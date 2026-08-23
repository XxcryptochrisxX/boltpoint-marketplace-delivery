# Marketplace Delivery Platform — Peer-to-Peer Furniture & Heavy Item Courier

A full-stack, on-demand logistics and delivery platform engineered specifically for peer-to-peer marketplaces (Facebook Marketplace, OfferUp, Craigslist) and local estate retail in Austin and surrounding metro regions.

The platform provides instant algorithmic quoting, Google-validated address and route mileage, driver dispatch workflows, automated receipt and invoice generation, and a **Seller Confidential Address Masking Engine** that lets sellers share delivery checkout links with buyers without ever disclosing their home address or apartment gate code.

---

## 🌟 Key Functional Portals & Capabilities

### 1. 🔒 Seller Confidential Link Generator (`/for-sellers`)
- **Address Masking Protection**: Sellers specify their exact residential or commercial address, apartment unit, gate code, and instructions. The platform hashes and masks the location down to the neighborhood and ZIP code (e.g., *"Downtown Austin (78701)"* or *"Mueller / East Austin (78723)"*).
- **Listing Item Customization**: Define item categories (Sofa, Dining Set, Dresser, Appliance, Heavy Tool), dimensions, photos, and seller availability windows.
- **Flexible Payment Splits**:
  - **Buyer Pays 100%**: Default buyer delivery checkout.
  - **Seller Subsidizes / Free Delivery**: Seller covers 100% of delivery to close deals faster.
  - **50 / 50 Split**: Seller covers half the delivery cost, auto-discounting the buyer's checkout bill.
- **Instant Sharing & QR Code**: Produces clean shareable links formatted for direct insertion into Facebook Marketplace / OfferUp chat prompts with single-click clipboard copying and live preview mode.

---

### 2. 🛋️ Buyer Seamless Checkout & Instant Booking (`/book-now` & `/get-quote`)
- **Direct Buyer Link Landing**: Opening a seller's link pre-populates item parameters and locks the pickup point to the masked neighborhood. The buyer simply enters their drop-off address.
- **Smart Distance & Dynamic Pricing Engine**: Google Address Validation and Routes APIs calculate driving mileage before applying transparent delivery and optional-service charges.
- **Schedule & Real-Time Booking**:
  - Immediate ASAP dispatch or date/time slot selection.
  - Live price breakdown (Base rate, mileage, helpers, stair fee, insurance tier).
  - Instant booking confirmation with tracking code generation (`#MD-XXXXX`).

---

### 3. 🛡️ Admin Control Center (`/admin`)
- **Comprehensive Dispatch Oversight**: Real-time monitor of all active, in-transit, and completed deliveries.
- **Seller Privacy Audit**: Full administrative transparency to inspect exact seller pickup addresses, gate access codes, contact details, and conversion analytics for all active seller links.
- **Driver Vetting & Approval**: Review pending driver applications, vehicle capacities (pickup truck, box truck, cargo van, trailer), and insurance credentials with single-click approval.
- **Financial Analytics & Payouts**: Real-time revenue tracking, platform commission management (20% platform / 80% driver + 100% tips), and gross volume reporting.

---

### 4. 🚚 Driver Onboarding & Dispatch Board (`/become-driver` & `/driver-dashboard`)
- **Live Job Board**: Interactive feed of available delivery requests filtered by vehicle requirement and route proximity.
- **One-Click Job Acceptance**: Drivers review payout, item weight, stair requirements, and destination before accepting.
- **Step-by-Step Delivery Progress Workflow**:
  - `Accept Job` ➡️ `En Route to Pickup` ➡️ `Item Loaded & Secured` ➡️ `Delivered & Signature / Photo Captured`.
- **Earnings & Payout Dashboard**: Tracks completed routes, instant payout requests, and customer tipping logs.

---

### 5. 🏢 Commercial & B2B Partner Portal (`/business`)
- Tailored for consignment shops, antique dealers, and furniture retailers.
- Tiered commercial discounts, automated billing receipts, dedicated dispatch manager, and priority weekend delivery slots.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (animations), Lucide React (icons).
- **Backend**: Node.js, Express, Vite development middleware, ESBuild production bundler.
- **Address & Routing**: Google Address Validation API and Routes API, called only from the server.
- **Data Persistence**: Unified client and server state storage with fallback Supabase schema connectors and offline localStorage durability.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ (or Node.js 20/22 LTS recommended)
- npm, pnpm, or bun

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 4. Production Build & Start
```bash
npm run build
npm run start
```

---

## 📦 How to Export to GitHub or Download ZIP

### Option A: Direct Export via AI Studio Platform UI (Recommended)
1. In Google AI Studio Build, look at the **top right corner** or the **Settings menu (⚙️)**.
2. Click **Export to GitHub** to push the entire repository directly to your GitHub profile or organization.
3. Click **Download ZIP** to immediately save the entire codebase archive to your local computer.

### Option B: Pre-Packaged Project ZIP Archive
A clean zip archive containing all application source files, styles, assets, configuration, and documentation is bundled in the workspace root:
- `marketplace-delivery-source.zip`

---

## 📄 License & Distribution

Marketplace Delivery Platform — Designed & Built for Peer-to-Peer Logistics.
All rights reserved.
