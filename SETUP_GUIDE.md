# SETUP_GUIDE.md

## Environment Configuration Template

Copy this to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=RK-AI
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=your_collection_id_here
```

## Appwrite Database Setup

### Create Collection Schema

In your Appwrite console, create a collection named "items" with:

**Attributes:**
- `title` - String (required, max 255 characters)
- `createdAt` - DateTime (required)

**Permissions:**
- Add read/write permissions for authenticated users

### Collection Settings
- Collection ID: Save this to `NEXT_PUBLIC_APPWRITE_COLLECTION_ID`
- Database ID: Save this to `NEXT_PUBLIC_APPWRITE_DATABASE_ID`

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables
# Edit .env.local with your Clerk and Appwrite credentials

# Run development server
npm run dev
```

## Verification Checklist

- [ ] Clerk keys configured
- [ ] Appwrite project created
- [ ] Database and collection created
- [ ] Collection attributes added
- [ ] Permissions set
- [ ] Environment variables added to .env.local
- [ ] App running on http://localhost:3000
