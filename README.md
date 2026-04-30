# BankruptcyBet

Predictive markets platform for Chapter 11 bankruptcy cases.  
Stack: **Express + Vite + React + TypeScript + Tailwind CSS + Drizzle ORM + SQLite**

---

## Demo Account

| Field    | Value                        |
|----------|------------------------------|
| Email    | `demo@bankruptcybet.com`    |
| Password | `BBdemo2026!`                |

> Change this password immediately after first login on a production server.

---

## Admin Panel

Visit `/#/admin` and enter the admin key to approve/deny access requests.

| Field     | Value          |
|-----------|----------------|
| Admin Key | `bb-admin-2026` (set `ADMIN_KEY` env var in production) |

---

## Droplet / VPS Setup

### 1. Prerequisites

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# (Optional) PM2 for process management
npm install -g pm2
```

### 2. Install & Build

```bash
git clone <your-repo> bankruptcybet
cd bankruptcybet
npm install
npm run build
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# REQUIRED in production — change these from defaults
SESSION_SECRET=your-long-random-secret-here
ADMIN_KEY=your-secure-admin-key-here

# Optional — SendGrid for email notifications on new access requests
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
```

### 4. Run with PM2

```bash
pm2 start dist/index.cjs --name bankruptcybet
pm2 save
pm2 startup   # auto-start on reboot
```

### 5. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name bankruptcybet.com www.bankruptcybet.com;

    # Proxy all /api/* requests to Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static frontend — fall back to index.html for SPA routing
    root /var/www/bankruptcybet/dist/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **Note:** With this config, Express only handles `/api/*`. Copy `dist/public/` to `/var/www/bankruptcybet/dist/public/` and Nginx serves the frontend directly. This is faster than proxying everything through Node.
>
> Alternatively, to proxy **everything** through Express (simpler setup):

```nginx
server {
    listen 80;
    server_name bankruptcybet.com www.bankruptcybet.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable HTTPS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bankruptcybet.com -d www.bankruptcybet.com
```

### 6. Database

SQLite DB file is created automatically at `bankruptcybet.db` in the directory where the server starts. Back this file up regularly:

```bash
cp bankruptcybet.db bankruptcybet.db.bak
```

---

## Access Request Flow

1. Visitor → `/#/request-access` → submits name, firm, email, role
2. You receive email at `rgj@rolandjones.com` (requires SendGrid key)
3. Visit `/#/admin`, enter admin key, approve request
4. Approved user registers at `/#/register` with their email
5. Login works — unapproved accounts are blocked

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Blank gate — Request Access or Log In |
| `/request-access` | Access request form |
| `/register` | Account creation (approved emails only) |
| `/login` | Login |
| `/dashboard` | Trading dashboard (auth required) |
| `/portfolio` | Portfolio (auth required) |
| `/admin` | Admin panel (admin key required) |

---

## Confidential

CONFIDENTIAL — Distributed solely pursuant to an executed Non-Disclosure Agreement.  
Unauthorized disclosure is strictly prohibited.

© BankruptcyBet LLC · Delaware
