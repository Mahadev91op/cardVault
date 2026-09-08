# 🚀 CardVault Production Deployment Guide

This guide provides end-to-end instructions for deploying **CardVault** to production on **Vercel** (recommended for Next.js), **Railway**, **Render**, or a custom **Linux VPS / Cloud Server**.

---

## 📋 Prerequisites Checklist

Before deploying, ensure you have:
- [x] A **MongoDB Atlas** cluster with your database and collections.
- [x] A **GitHub** repository containing this project code.
- [x] A Gmail account with an **App Password** for automated customer emails.

---

## ⚡ Option 1: Deploy to Vercel (Recommended — 2 Minutes)

Vercel is the native platform for Next.js and provides instant deployment with edge caching and zero configuration.

### Step 1: MongoDB Atlas Network Access (Critical)
Because serverless functions (like Vercel Lambdas) change IP addresses dynamically:
1. Go to **[MongoDB Atlas](https://cloud.mongodb.com)**.
2. In the left sidebar, click **Network Access** under Security.
3. Click **Add IP Address**.
4. Click **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Confirm**.

### Step 2: Import Project into Vercel
1. Go to **[Vercel Dashboard](https://vercel.com)** and click **Add New... > Project**.
2. Connect your GitHub account and select your **CardVault** repository.
3. Keep the default Framework Preset: **Next.js**.

### Step 3: Add Environment Variables
Expand the **Environment Variables** section in the Vercel import page and copy the values from `.env.local` or `.env.example`:

| Key | Example Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://...` or `mongodb+srv://...` | Full MongoDB connection string |
| `JWT_SECRET` | `cardvault_super_secret_session_key_2026` | Secure random key for session tokens |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Your production website URL |
| `ADMIN_EMAILS` | `mahadevtanti191@gmail.com` | Email(s) granted Admin privileges |
| `ADMIN_NOTIFICATION_EMAIL` | `mahadevtanti191@gmail.com` | Receives new order & payment alerts |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP Server Host |
| `SMTP_PORT` | `465` | SSL Port for SMTP |
| `SMTP_USER` | `mahadevtanti191@gmail.com` | Sender Gmail address |
| `SMTP_PASS` | `phcxyxccdvglaukw` | 16-character Google App Password |

### Step 4: Deploy
Click **Deploy**. Vercel will compile the project, run TypeScript/lint checks, build all static pages and API routes, and deploy your live site in under 60 seconds!

---

## 🚂 Option 2: Deploy to Railway

1. Go to **[Railway.app](https://railway.app)** and click **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. Go to **Variables** tab and add the same environment variables listed in the table above.
4. Railway will automatically detect Next.js and run `npm run build` and `npm run start`.
5. Under **Settings > Networking**, click **Generate Domain** to get your public URL.
6. Update `NEXT_PUBLIC_APP_URL` to match your Railway domain.

---

## 🖥️ Option 3: Deploy to Linux VPS (Ubuntu / Debian with PM2 & Nginx)

If running on a VPS (DigitalOcean, AWS EC2, Linode, Hostinger):

```bash
# 1. Clone repository
git clone <your-repo-url> /var/www/cardvault
cd /var/www/cardvault

# 2. Install dependencies
npm install --production=false

# 3. Create .env.local file
cp .env.example .env.local
nano .env.local # Fill in real credentials

# 4. Build optimized production bundle
npm run build

# 5. Start with PM2 process manager
npm install -g pm2
pm2 start npm --name "cardvault" -- start
pm2 save
pm2 startup
```

### Nginx Reverse Proxy Sample Configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 Post-Deployment Verification Checklist

Once deployed:
1. **Visit Homepage**: Verify cards load smoothly on both mobile and desktop.
2. **User Registration / Login**: Create a test customer account, verify persistent login across tabs.
3. **Admin Dashboard**: Sign in with `mahadevtanti191@gmail.com` and open `/admin` to verify access to cards, orders, and users.
4. **End-to-End Order Test**:
   - Buy a card as a customer with a test 12-digit UTR and screenshot.
   - Check if Admin email notification arrives in Gmail inbox.
   - Open `/admin`, click **Verify & Release Card**.
   - Check if Customer receives the card unlocked email with CVV and credentials.
   - Customer opens `/profile/orders` to copy card credentials.
