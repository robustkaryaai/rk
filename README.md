# RK AI - Next Generation Intelligence Platform

A production-ready Next.js 14 application with Clerk authentication, Appwrite database integration, and a stunning glassmorphism UI.

## 🚀 Features

- **Authentication**: Clerk-powered auth with email/password + Google login
- **Database**: Appwrite SDK for data management
- **UI**: Glassmorphism theme with light/dark mode
- **Mobile-First**: Responsive design optimized for all devices
- **Protected Routes**: Automatic authentication enforcement
- **Real-time CRUD**: Full data management with Appwrite

## 📁 Project Structure

```
rk-ai-app/
├── app/
│   ├── globals.css          # Glassmorphism theme
│   ├── layout.js            # Root layout with ClerkProvider
│   ├── page.js              # Root redirect logic
│   ├── login/page.js        # Authentication page
│   ├── home/page.js         # Dashboard with quick actions
│   ├── data/page.js         # Data management with CRUD
│   ├── settings/page.js     # Settings with dark mode toggle
│   └── profile/page.js      # User profile display
├── components/
│   ├── BottomNav.js         # Glassmorphic bottom navigation
│   └── GlassCard.js         # Reusable glass card component
├── lib/
│   ├── appwrite.js          # Appwrite client singleton
│   └── auth.js              # Auth utility functions
└── middleware.js            # Clerk route protection
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
```

### 3. Configure Appwrite

1. Go to [Appwrite Cloud](https://cloud.appwrite.io)
2. Create a new project
3. Create a database and collection named "items" with these attributes:
   - `title` (String, required)
   - `createdAt` (DateTime, required)
4. Add to `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=RK-AI
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎨 Features Overview

### Authentication Flow
- Unauthenticated users see only the login page
- After login, users are redirected to `/home`
- Bottom navigation appears only for authenticated users

### Pages

**Home** - Dashboard with quick actions and latest items
**Data** - Full CRUD operations for managing data items
**Settings** - Dark mode toggle, app info, and logout
**Profile** - User account information from Clerk

### Dark Mode
Toggle dark mode in Settings. Preference is saved to localStorage.

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Database**: Appwrite
- **Styling**: Pure CSS (Glassmorphism)
- **Icons**: React Icons
- **Language**: JavaScript (no TypeScript)

## 📱 Mobile-First Design

The application is fully responsive with a mobile-first approach:
- Fixed bottom navigation on mobile
- Touch-friendly interactive elements
- Optimized layouts for all screen sizes

## 🎯 Production Ready

This application includes:
- ✅ Protected routes with middleware
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Clean code structure
- ✅ Reusable components

---

Built with 💜 by RK-AI Team
