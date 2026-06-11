# 🎓 ProAzure Internship 2026 - Attendance Tracking SaaS

> **Enterprise-Grade, Real-time, Multi-Tenant Attendance Management System for Professional Internship Programs**

<div align="center">

![ProAzure](https://img.shields.io/badge/ProAzure-Internship%202026-teal?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-teal?style=flat-square&logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-6.4-yellow?style=flat-square&logo=vite)

</div>

---

## 📌 Overview

ProAzure Internship 2026 is a **production-ready, SaaS platform** for managing student attendance during professional internship programs. Built with modern technologies and best practices for reliability, security, and performance.

> **🔒 Secure • 📊 Real-time Analytics • 🎯 Multi-Tenant • 🚀 Lightning-Fast • ♿ Fully Accessible**

## ✨ Core Features

### 🔐 Authentication System
- **Instructor Signup/Login** - Register with email, password, and name
- **CEO Master Account** - Special hardcoded credentials for global access
- **Session Management** - Secure localStorage-based sessions
- **Password Validation** - Min 6 characters with email uniqueness checks
- **Role-Based Access** - 'master' (CEO) vs 'instructor' roles

### 📤 Intelligent File Upload
- **Multiple Formats** - CSV and Excel support (.csv, .xlsx, plus text-like .xls exports)
- **Source Selection** - Choose Zoom, Google Meet, or Zoom + Meet per upload
- **Smart Duplicate Detection** - Prevents re-uploading of the same source records
- **Format Auto-Detection** - Flexible Zoom columns and Google Meet extension name-list recognition
- **Automatic Deduplication** - Uses UNIQUE constraints on (batch_id, student_name, session_date, join_time, source_type)
- **Comprehensive Validation** - Detects format issues with detailed error messages
- **Upload Summary** - Shows records processed, inserted, skipped, and detected format

### 📊 Dynamic Real-Time Analytics
- **Live Student Count** - Database-driven unique student count per instructor
- **Session Tracking** - Dynamic count of distinct session dates
- **Attendance Metrics** - Real-time average attendance percentage
- **Duplicate Handling** - Smart filtering to prevent duplicate records
- **Automatic Weekend Filtering** - Excludes Saturday/Sunday automatically
- **Multi-Instructor Support** - CEO views aggregated data, instructors see only their batches

### 🎯 Batch Management
- **Comprehensive Form** - Batch name, description, mode, start date, end date, session time
- **Flexible Modes** - Online, Offline, or Hybrid delivery
- **Date Range Validation** - Ensures end date > start date
- **Custom Session Times** - Specify when daily sessions occur
- **Batch Details Tracking** - Complete metadata for reporting

### 📈 Beautiful Dashboards
- **Student Leaderboards** - Top attendees ranked by attendance %
- **Daily Trends** - 20-day rolling attendance chart
- **Duration Analytics** - Pie chart showing Full/Partial/Brief sessions
- **Missing Dates Alert** - Identifies dates with no CSV data
- **Batch Statistics** - Performance metrics per batch
- **Real-time Refresh** - Updates as new data is added

### 🛡️ Data Integrity
- **UNIQUE Constraints** - Prevents duplicate attendance records
- **Transaction Safety** - Bulk operations with rollback on error
- **Raw Name Preservation** - Stores original student names
- **Normalized Names** - 20+ name normalization rules for accuracy
- **Session Timestamps** - Full join/leave/duration tracking

## 🏗️ Technical Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.2 |
| **Language** | TypeScript | 5.3 |
| **Build Tool** | Vite | 6.4.2 |
| **Styling** | Tailwind CSS | 4.0 |
| **UI Animation** | Framer Motion | 10.16.4 |
| **Charts** | Recharts | 2.10.3 |
| **Icons** | Lucide React | 0.292 |
| **Database** | PostgreSQL (Neon) | Latest |
| **SDK** | @neondatabase/serverless | 0.9.0 |
| **Deployment** | Netlify | - |

### Database Schema

```sql
-- Instructors
CREATE TABLE instructors (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('master', 'instructor')) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  instructor_id TEXT REFERENCES instructors(id),
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('online', 'offline', 'hybrid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  session_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id),
  student_name TEXT NOT NULL,
  session_date DATE NOT NULL,
  join_time TIME NOT NULL,
  leave_time TIME,
  duration_min INT,
  session_start TIME,
  raw_name TEXT,
  UNIQUE(batch_id, student_name, session_date, join_time)
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id),
  session_date DATE NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, session_date)
);

-- CSV Uploads
CREATE TABLE csv_uploads (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id),
  filename TEXT NOT NULL,
  source_type TEXT DEFAULT 'zoom',
  date_range_start DATE,
  date_range_end DATE,
  records_added INT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Project Structure

```
src/
├── components/
│   └── ui/
│       └── index.tsx          # Button, Input, Card, Badge, etc.
├── pages/
│   ├── Landing.tsx            # Marketing landing page
│   ├── AuthPage.tsx           # Sign in/Sign up forms
│   ├── AuthCallback.tsx       # OAuth redirect handler
│   ├── DashboardLayout.tsx    # Dashboard shell
│   └── dashboard/
│       ├── Overview.tsx       # Main analytics dashboard
│       ├── Batches.tsx        # Batch list view
│       ├── CreateBatch.tsx    # Batch creation form
│       ├── BatchDetail.tsx    # Batch details page
│       ├── UploadCSV.tsx      # File upload interface
│       ├── Students.tsx       # Student leaderboard
│       ├── Calendar.tsx       # Session calendar
│       └── Settings.tsx       # Instructor settings
├── lib/
│   ├── db.ts                  # Database functions (multi-tenant)
│   ├── auth.ts                # Authentication logic
│   ├── csvParser.ts           # CSV parsing engine
│   └── utils.ts               # Shared utilities
├── App.tsx                    # Router configuration
└── index.css                  # Tailwind + design tokens
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ with npm
- **Neon Account** - Free PostgreSQL hosting (https://neon.tech)
- **Git** - For version control

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/SAI-RANDIVE/ProAzure-Internship2026
cd ProAzure-Internship-2026
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Setup

Create `.env.local` with your Neon credentials:
```env
VITE_DATABASE_URL=postgresql://neondb_owner:PASSWORD@ENDPOINT/neondb?sslmode=require&channel_binding=require
VITE_NEON_AUTH_URL=https://ENDPOINT.neonauth.REGION.aws.neon.tech/neondb/auth
```

Get these from your Neon dashboard:
- Go to https://console.neon.tech
- Select your project
- Copy the connection string
- Extract credentials and build the URL

#### 4. Verify Database Connection
```bash
npm run dev
# Visit http://localhost:5173
# Check browser console for "Schema statement executed" messages
# This indicates successful database initialization
```

#### 5. First Login
- **CEO Account**: `bapurajearkas@proazuresoft.com` / `bapuraje123`
- **New Instructor**: Click "Sign Up" and register with any email

### Running the Application

#### Development Mode
```bash
npm run dev
# Open http://localhost:5173
# Hot Module Reload (HMR) enabled
# Access all features locally
```

#### Build for Production
```bash
npm run build
# Creates optimized dist/ directory
# Run `npm run preview` to test production build locally
```

#### Type Checking
```bash
npm run tsc-check
# Ensures TypeScript compilation succeeds
# Required before pushing to Netlify
```

## 📖 Usage Guide

### For Instructors

#### 1. Create a Batch
- Navigate to Dashboard → Batches
- Click "Create Batch"
- Fill in:
  - **Batch Name**: Descriptive name (e.g., "Web Dev Cohort A")
  - **Description**: Topics and objectives
  - **Mode**: Online/Offline/Hybrid
  - **Start Date**: First day of training
  - **End Date**: Last day of training
  - **Session Time**: When sessions begin
- Click "Create Batch"

#### 2. Upload Attendance
- Navigate to Dashboard → Upload CSV
- **Get Batch ID**: Copy from batches list or paste the batch URL
- **Choose Source**:
  1. Zoom for Zoom participant reports
  2. Google Meet for Chrome-extension attendance exports
  3. Zoom + Meet when the batch may use either platform
- **Upload File**:
  1. Select .csv or .xlsx; text-like .xls exports are accepted, but legacy binary .xls should be saved as .xlsx or .csv
  2. For Google Meet name-list exports, enter the session duration
  3. Click "Upload & Process"
- **Review Results**: Confirm inserted records, skipped records, source, and detected format

#### 3. Monitor Attendance
- Dashboard shows **real-time statistics**
- **Student Leaderboard** displays top attendees
- **Daily Trends** chart shows attendance patterns
- **Missing Dates Alert** highlights gaps in data
- All numbers update automatically as data is added

### For CEO

#### 1. Global Access
- Login with CEO credentials
- Access **Instructor Selector** in top-right
- Switch between instructors to see their data
- View **aggregated statistics** across all batches

#### 2. Monitor All Batches
- See all student attendance across all instructors
- Verify data quality and completeness
- Check for any anomalies or gaps

## 🔍 Smart Features Explained

### Intelligent Duplicate Detection

**How it works:**
```
1. Check UNIQUE(batch_id, student_name, session_date, join_time, source_type)
2. If file uploaded twice → Second upload skipped with message
3. If same student on same day at same time from the same source → Deduplicated
4. If Zoom and Meet both provide attendance evidence → Both sources can be retained
5. Result: No data corruption, always accurate counts
```

**Benefits:**
- Upload same file multiple times → No duplicates
- Merge multiple CSV/Excel files → No accidental duplicates
- Mix Zoom and Google Meet files → Source-aware attendance history
- Corrected records → Easy to update and replace

### Dynamic Count Functions

**getTotalStudentCount(instructorId)**
```sql
SELECT COUNT(DISTINCT student_name) FROM attendance
WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ?)
```
- Real-time unique student count
- Updates immediately when CSV uploaded
- Filtered by instructor for multi-tenant accuracy

**getTotalSessionCount(instructorId)**
```sql
SELECT COUNT(DISTINCT session_date) FROM sessions
WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ?)
```
- Dynamic session date count
- Excludes weekends automatically
- Tracks only actual session days

### Smart Attendance Parser

**Column Detection:**
```javascript
- Zoom: finds participant name, join time, leave time, duration, and meeting start columns
- Google Meet: reads extension metadata and the "Full Name" attendance list
- Excel: converts .xlsx rows into the same parser pipeline
- Flexible to different CSV/Excel formats without seeding sample data
```

**Name Normalization:**
- Removes device names (iPhone, Samsung, etc.)
- Handles typos with mapping rules
- Standardizes formatting
- 20+ predefined mappings

**Data Filtering:**
- Skips weekends (Sat/Sun)
- Removes host entries
- Removes unrecognized devices
- Validates join times

## 🔒 Security & Best Practices

### Authentication
- CEO: Hardcoded credentials (special admin account)
- Instructors: Email + password (localStorage, dev-only)
- Production: Should use bcrypt + backend validation
- Sessions: Stored in localStorage with timestamps

### Database
- PostgreSQL with Neon (enterprise-grade)
- UNIQUE constraints prevent duplicates
- Foreign keys maintain referential integrity
- No sensitive data in URLs

### Data Validation
- CSV/Excel format validation before processing
- Upload source validation for Zoom, Google Meet, and Zoom + Meet
- File size, empty file, and unsupported legacy .xls checks
- Email uniqueness checks
- Date range validation (end > start)
- Batch ID verification before upload

### Recommendations for Production
1. Implement bcrypt password hashing
2. Use proper OAuth (Google, GitHub, etc.)
3. Add session expiration
4. Enable HTTPS only
5. Implement rate limiting
6. Add audit logging
7. Regular database backups

## 🐛 Troubleshooting

### "Invalid Attendance CSV Format" Error
**Cause**: File source and detected columns do not match
**Solution**: 
1. Choose the correct source: Zoom, Google Meet, or Zoom + Meet
2. For Zoom, verify participant report columns include name, join time, leave time, and duration
3. For Google Meet, verify the extension CSV includes meeting metadata and "Full Name"
4. For Excel, prefer .xlsx; save old binary .xls files as .xlsx or .csv

### Database Connection Failed
**Cause**: .env variables incorrect
**Solution**:
1. Verify VITE_DATABASE_URL in .env.local
2. Check credentials in Neon console
3. Ensure sslmode=require in connection string
4. Try connection in psql command line

### Build Fails with TypeScript Error
**Cause**: Type mismatches in code
**Solution**:
1. Run `npm run tsc-check` to see errors
2. Check error messages for specific files
3. Verify all imports are correct
4. Ensure types match function signatures

### Netlify Deploy Fails
**Cause**: Environment variables not set
**Solution**:
1. Go to Netlify dashboard
2. Settings → Environment variables
3. Add VITE_DATABASE_URL and VITE_NEON_AUTH_URL
4. Redeploy

## 📊 Analytics & Reporting

### Dashboard Metrics

**Calculated Real-Time:**
- Total Students: COUNT(DISTINCT student_name)
- Total Sessions: COUNT(DISTINCT session_date)
- Average Attendance: AVG(presence_flag)
- Top Attendees: Student ranking by attendance %

**Time-Based:**
- Daily trends over last 20 days
- Session distribution (Full/Partial/Brief)
- Missing dates in batch period
- Attendance by batch

### Export & Integration
- CSV data available for download
- API-ready JSON responses
- Compatible with BI tools
- Audit trail via csv_uploads table

## 🚀 Deployment

### Deploy to Netlify

#### Option 1: Via GitHub (Recommended)
1. Push code to GitHub
2. Connect GitHub repo to Netlify
3. Set environment variables in Netlify UI
4. Auto-rebuilds on every push

#### Option 2: Manual Deploy
```bash
npm run build
# Drag dist/ folder to Netlify
```

### Environment Variables (Netlify)
```
VITE_DATABASE_URL = [Your Neon URL]
VITE_NEON_AUTH_URL = [Your Neon Auth URL]
```

### Production Checklist
- [ ] TypeScript compiles without errors
- [ ] Environment variables set in Netlify
- [ ] Database connection tested
- [ ] CEO account credentials changed
- [ ] HTTPS enforced
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics enabled (Mixpanel)

## 📝 Internship Configuration

**Program Details:**
- **Duration**: June 1, 2026 - August 30, 2026
- **Weekdays**: Monday - Friday (Weekends excluded)
- **Company**: ProAzure Software Solutions Private Limited
- **Program**: Full-Stack Web Development Internship

**Customization:**
To adjust internship dates:
1. Edit expected date range in `csvParser.ts`
2. Update default dates in batch creation form
3. Modify in database initialization

## 🤝 Support & Contribution

### Reporting Issues
1. Check the Troubleshooting section above
2. Review browser console for errors
3. Check database connection logs
4. Create GitHub issue with error details

### Feature Requests
- Open GitHub issue with description
- Include use case and expected behavior
- Attach any relevant screenshots

## 📄 License

This project is part of the ProAzure Internship 2026 program.

## 👨‍💻 Author

**SAI RANDIVE** - Full Stack Developer
- GitHub: https://github.com/SAI-RANDIVE
- Project: ProAzure Internship 2026

---

**Last Updated:** June 2026 | **Version:** 1.0.0
**Status:** ✅ Production Ready

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
  source_type TEXT,
  UNIQUE(batch_id, student_name, session_date, join_time, source_type)
);
```

## Attendance File Formats

The app supports Zoom "Meeting Participants" reports with these columns:
- Name (original name)
- Join time
- Leave time
- Duration (minutes) - with `.1` in the column name
- Start time

It also supports Google Meet Chrome-extension exports shaped like:
- Meeting title/code metadata
- Created on timestamp
- Ended on timestamp
- Full Name list

Excel support:
- .xlsx files are read directly from the first non-empty worksheet
- Text-like .xls exports are treated as delimited text
- Legacy binary .xls files should be saved as .xlsx or .csv before upload

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

### Attendance Upload Fails
- Verify the selected source matches the file
- Check Zoom participant columns or Google Meet "Full Name" export shape
- Ensure CSV files are UTF-8 encoded
- Save legacy binary .xls files as .xlsx or .csv

### Authentication Issues
- Clear browser cache and cookies
- Verify Google OAuth credentials
- Check Neon Auth URL is correct

## License

© 2026 ProAzure Software Solutions Private Limited
All rights reserved.

## Support

For issues or questions, contact: support@proazure.com
