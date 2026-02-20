<h1 align="center"> GrowLiv App (Mobile + Admin + API) </h1>

✨ **Highlights:**

- 📱 Fully Functional E-Commerce Mobile App (React Native + Expo)
- 🔐 Secure Authentication with Clerk (Google & Apple sign-in)
- 🛒 Cart, Favorites, Checkout & Orders Flow
- 💳 Stripe-Powered Payments
- 🗺️ Addresses System
- 🏪 Admin Dashboard — Products, Orders, Customers & Stats
- ⚙️ Complete REST API (Node.js + Express) with Auth & Roles
- 🛂 Admin-Only Protected Routes
- 📦 Background Jobs with Inngest
- 🧭 Dashboard with Live Analytics
- 🛠️ Product Management (CRUD, image handling, pricing, etc.)
- 📦 Order Management
- 👥 Customer Management Page
- 🛡️ Sentry Integration for monitoring & error tracking
- 🚀 Deployment on Sevalla (API + Admin Dashboard)
- 🖼️ Product Image Slider
- ⚡ Data Fetching & Caching with TanStack Query
- 🧰 End-to-End Git & GitHub Workflow (branches, commits, PRs, code reviews)
- 🤖 CodeRabbit PR Analysis (security, quality, optimization)

---

## 🧪 `.env` Setup

### 🟦 Backend (`/backend`)

```bash
NODE_ENV=development
PORT=3000

DB_URL=<MONGDB>

CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<CLERK_SECRET_KEY>

INNGEST_SIGNING_KEY=<INNGEST_SIGNING_KEY>

CLOUDINARY_API_KEY=<CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<CLOUDINARY_API_SECRET>
CLOUDINARY_CLOUD_NAME=<CLOUDINARY_CLOUD_NAME>

ADMIN_EMAIL=<ADMIN_EMAIL>

CLIENT_URL=http://localhost:5173

MIDTRANS_SERVER_KEY=<MIDTRANS_SERVER_KEY>
MIDTRANS_CLIENT_KEY=<MIDTRANS_CLIENT_KEY>
MIDTRANS_IS_PRODUCTION=true

```

---

### 🟩 Admin Dashboard (/admin)

```bash
VITE_CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
VITE_API_URL=http://localhost:3000/api


```

---

### 🟧 Mobile App (/mobile)

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY= <CLERK_PUBLISHABLE_KEY>

```

## 🔧 Run the Backend

```bash

cd backend
npm install
npm run dev
```

---

## 🔧 Run the Admin

```
bash
cd admin
npm install
npm run dev
```

---

## 🔧 Run the Mobile

```
bash
cd mobile
npm install
npx expo start
*And then scan the QR Code from your phone*
```
