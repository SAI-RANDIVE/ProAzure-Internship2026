# ProAzure Internship 2026 Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` file:
```
VITE_DATABASE_URL=postgresql://neondb_owner:npg_PO8zjLkMG7gI@ep-misty-sea-aoxxr7ju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
VITE_NEON_AUTH_URL=https://ep-misty-sea-aoxxr7ju.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth
```

### 3. Start Development
```bash
npm run dev
```

Visit http://localhost:5173

---

## Detailed Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Neon database project (https://neon.tech/signup)
- A web browser

### Step-by-Step

#### A. Project Setup
```bash
# Navigate to project directory
cd ProAzure-Internship-2026

# Install all dependencies
npm install

# Create .env.local file (copy from .env.example)
cp .env.example .env.local
```

#### B. Database Configuration

1. Go to https://console.neon.tech/
2. Create a new project if you don't have one
3. Get your connection string from the dashboard
4. Update `.env.local` with:
   - `VITE_DATABASE_URL` - Full PostgreSQL connection string
   - `VITE_NEON_AUTH_URL` - Neon Auth endpoint

#### C. Development

```bash
# Start dev server
npm run dev

# In another terminal, type check (optional)
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Features to Try

### 1. Landing Page
- Browse `/` to see the marketing site
- Click "Get Started" button

### 2. Authentication
- Go to `/auth` to see login page
- Click "Sign in with Google" (mocked for now)
- Set up real Google OAuth for production

### 3. Dashboard
- After login, you're on the dashboard
- Navigate using the sidebar
- Create your first batch using "New Batch" button

### 4. CSV Upload
- Go to "Upload CSV" page
- Try uploading a Zoom meeting report CSV
- See real-time parsing and validation

---

## Customization

### Colors & Branding
Edit `src/index.css`:
```css
:root {
  --brand-teal: #1de9b6;
  --brand-blue: #2979ff;
  --brand-dark: #0d1117;
}
```

### Fonts
Google Fonts imported in `src/index.css`:
- Display: Instrument Serif
- Body: Inter

### Logo
Update SVG in:
- `src/pages/Landing.tsx`
- `src/pages/AuthPage.tsx`
- `src/pages/DashboardLayout.tsx`

---

## Deployment

### Netlify (Recommended)

1. **Push to GitHub**
```bash
git remote add origin https://github.com/yourusername/proazure-internship.git
git branch -M main
git push -u origin main
```

2. **Connect to Netlify**
- Go to https://app.netlify.com
- Click "New site from Git"
- Connect your GitHub repository
- Set build command: `npm run build`
- Set publish directory: `dist`

3. **Add Environment Variables**
In Netlify dashboard:
- Add `VITE_DATABASE_URL`
- Add `VITE_NEON_AUTH_URL`

4. **Deploy**
- Click "Deploy site"
- Your app will be live in 1-2 minutes!

### Manual Deployment (Vercel, Render, etc.)

```bash
# Build the project
npm run build

# The `dist` folder is ready to deploy
# Upload to your hosting provider
```

---

## Database Schema

The app creates these tables automatically:

```sql
-- Instructors (authenticated users)
instructors (id, email, name, avatar_url, created_at)

-- Internship batches/classes
batches (id, instructor_id, name, description, mode, start_date, end_date, session_time, created_at)

-- Session tracking
sessions (id, batch_id, session_date, topic, created_at)

-- Attendance records
attendance (id, batch_id, student_name, session_date, join_time, leave_time, duration_min, session_start, raw_name, created_at)

-- CSV upload history
csv_uploads (id, batch_id, filename, date_range_start, date_range_end, records_added, uploaded_at)
```

---

## Troubleshooting

### Issue: "VITE_DATABASE_URL is not defined"
**Solution**: Make sure `.env.local` exists with correct values
```bash
cat .env.local  # Check file exists
echo $VITE_DATABASE_URL  # Should show your connection string
```

### Issue: Port 5173 already in use
**Solution**: Use a different port
```bash
npm run dev -- --port 3000
```

### Issue: CSV upload not working
**Solution**: 
- Verify file is in Zoom "Meeting Participants" format
- Check column headers match exactly
- Try a sample CSV first

### Issue: Build fails
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

---

## Project Structure

```
ProAzure-Internship-2026/
├── public/                 # Static files
├── src/
│   ├── components/
│   │   └── ui/            # Reusable UI components
│   ├── pages/             # Page components
│   │   ├── Landing.tsx    # Marketing page
│   │   ├── AuthPage.tsx   # Login page
│   │   ├── DashboardLayout.tsx  # Sidebar layout
│   │   └── dashboard/     # Dashboard pages
│   ├── lib/
│   │   ├── db.ts         # Database queries
│   │   ├── auth.ts       # Auth utilities
│   │   ├── csvParser.ts  # CSV parsing logic
│   │   └── utils.ts      # Helper functions
│   ├── App.tsx            # Router setup
│   ├── main.tsx           # Entry point
│   └── index.css          # Styles & design tokens
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind CSS config
├── netlify.toml           # Netlify configuration
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
└── README.md              # Documentation
```

---

## Next Steps

1. **Customize branding**
   - Update company name, logo, colors
   - Modify landing page copy

2. **Set up real authentication**
   - Configure Google OAuth credentials
   - Test with real Gmail accounts

3. **Test CSV upload**
   - Export a real Zoom meeting report
   - Test parsing and data import

4. **Deploy to Netlify**
   - Connect GitHub repository
   - Set environment variables
   - Go live!

5. **Invite instructors**
   - Share dashboard link
   - Let instructors create batches
   - Start tracking attendance!

---

## Support & Questions

- **Documentation**: See README.md
- **Code Comments**: Most functions are documented
- **TypeScript**: Full type safety throughout

---

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Database credentials are environment-only
- CSV files are processed client-side
- All data encrypted in transit (HTTPS)
- Implement rate limiting before production

---

Generated: June 2026
ProAzure Software Solutions Private Limited
