# 🎓 ProAzure Internship 2026 - Attendance Tracking SaaS

> **Professional, Real-time, Multi-Tenant Attendance Management System for Web Internship Programs**

<div align="center">

![ProAzure](https://img.shields.io/badge/ProAzure-Internship%202026-teal?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-teal?style=flat-square&logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)

</div>

---

## 📌 Overview

ProAzure Internship 2026 is a **production-ready SaaS platform** for managing student attendance during the Web Internship program (June 1 - August 30, 2026). Built with cutting-edge technology.

✨ **Real-time Analytics** | 🔐 **Secure Multi-Tenant** | 📊 **Beautiful Dashboards** | 🚀 **Lightning-Fast** | 🎨 **Fully Responsive**

## Features

✅ **Google Authentication** - Sign in with Gmail accounts
✅ **Multi-Instructor SaaS** - Each instructor manages their own batch
✅ **CSV Upload & Parsing** - Upload Zoom meeting reports
✅ **Smart Data Processing** - Automatic name normalization, weekend filtering, deduplication
✅ **Real-time Dashboard** - Beautiful, colorful analytics with charts
✅ **Attendance Tracking** - Track student attendance with detailed analytics
✅ **Missing Date Alerts** - Shows which dates are missing CSV uploads
✅ **Session Management** - Online/Offline/Hybrid batch types
✅ **Neon Database** - PostgreSQL backend with real-time syncing
✅ **Netlify Ready** - Deploy directly to Netlify

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + custom design tokens
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Neon Postgres (PostgreSQL)
- **Auth**: Neon Auth + Google OAuth
- **CSV Parsing**: Native JavaScript with regex
- **Hosting**: Netlify

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- A Neon project (https://neon.tech)
- Google OAuth credentials

### Installation

1. **Clone & Install**
```bash
cd ProAzure-Internship-2026
npm install
```

2. **Configure Environment**

Create `.env.local`:
```
VITE_DATABASE_URL=postgresql://neondb_owner:npg_...@ep-....neondb.tech/neondb?sslmode=require&channel_binding=require
VITE_NEON_AUTH_URL=https://ep-....neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth
```

3. **Initialize Database**

```bash
npm run init-db
```

4. **Start Development Server**

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── components/ui/          # Reusable UI components
├── pages/                  # Page components
│   ├── Landing.tsx         # Marketing landing page
│   ├── AuthPage.tsx        # Authentication page
│   ├── DashboardLayout.tsx # Dashboard sidebar + layout
│   └── dashboard/          # Dashboard pages
├── lib/
│   ├── db.ts              # Neon database helpers
│   ├── auth.ts            # Authentication utilities
│   ├── csvParser.ts       # Zoom CSV parser
│   └── utils.ts           # Shared utilities
├── App.tsx                # Main router
└── index.css              # Global styles & design tokens
```

## Key Features Explained

### CSV Upload & Parsing

The platform accepts Zoom meeting reports in CSV format:
- Automatically detects column headers
- Normalizes student names (handles device names, typos)
- Filters weekends (Saturday/Sunday)
- Skips host entries
- Deduplicates entries
- Extracts join/leave times and duration

### Database Schema

- **instructors** - Instructor accounts with Google Auth
- **batches** - Internship batches (name, mode, dates, timing)
- **attendance** - Student attendance records with timestamps
- **sessions** - Tracked session dates
- **csv_uploads** - Upload history and metadata

### Analytics & Dashboard

The dashboard shows:
- Total students and sessions
- Average attendance %
- Daily attendance trends
- Student leaderboards
- Duration split (Full/Partial/Brief sessions)
- Missing CSV dates for the internship
- Top attendees ranking
- Batch management overview

## Internship Configuration

**Program**: Web Internship 2026
**Duration**: June 1, 2026 - August 30, 2026
**Weekdays**: Mon-Fri (Sat/Sun excluded)
**Company**: ProAzure Software Solutions Private Limited

## Deployment to Netlify

1. **Build**
```bash
npm run build
```

2. **Deploy**
- Push to GitHub
- Connect repository to Netlify
- Set environment variables in Netlify settings
- Deploy!

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Database Initialization

The app automatically initializes the database schema on first run. Key tables:

```sql
CREATE TABLE instructors (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id TEXT REFERENCES instructors(id),
  name TEXT,
  mode TEXT (online|offline|hybrid),
  start_date DATE DEFAULT '2026-06-01',
  end_date DATE DEFAULT '2026-08-30',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES batches(id),
  student_name TEXT,
  session_date DATE,
  join_time TEXT,
  leave_time TEXT,
  duration_min INT,
  UNIQUE(batch_id, student_name, session_date, join_time)
);
```

## CSV Format Expected

The app expects Zoom "Meeting Participants" report with these columns:
- Name (original name)
- Join time
- Leave time
- Duration (minutes) - with `.1` in the column name
- Start time

Example processing:
```
Raw CSV Row:
"Aditya ( Aditya Mahagavkar )","06/09/2026 08:42:57 PM","06/09/2026 08:43:00 PM","1"

Parsed:
name: "Aditya Mahagavkar"
date: "2026-06-09"
join: "20:42"
leave: "20:43"
dur: 1
```

## Features Roadmap

- [ ] Real-time WebSocket updates
- [ ] Bulk CSV upload for multiple dates
- [ ] Attendance reports PDF export
- [ ] SMS/Email notifications
- [ ] Student portal access
- [ ] Attendance policies & rules
- [ ] Performance analytics

## Troubleshooting

### Database Connection Error
- Verify Neon credentials in `.env.local`
- Check database URL format
- Ensure IP whitelist includes your machine

### CSV Upload Fails
- Verify CSV is from Zoom "Meeting Participants" report
- Check column headers are exactly as expected
- Ensure UTF-8 encoding

### Authentication Issues
- Clear browser cache and cookies
- Verify Google OAuth credentials
- Check Neon Auth URL is correct

## License

© 2026 ProAzure Software Solutions Private Limited
All rights reserved.

## Support

For issues or questions, contact: support@proazure.com
