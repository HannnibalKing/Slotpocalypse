# MongoDB Atlas Setup Guide

## Overview

MongoDB Atlas is a cloud-hosted MongoDB database service. This guide covers setup and integration with Vercel-hosted Next.js applications.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Vercel account
- Next.js application with API routes

---

## Part 1: MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email or Google account

### 2. Create a Cluster

1. Choose "Create a Cluster"
2. Select **M0 Sandbox** (Free tier)
   - Storage: 512 MB
   - Shared RAM
   - No credit card required
3. Choose cloud provider: **AWS** (recommended)
4. Select region closest to your users
5. Name your cluster (e.g., "CasinoCluster")
6. Click "Create Cluster" (takes 3-5 minutes)

### 3. Configure Database Access

1. Go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. Choose authentication method: **Password**
4. Set username (e.g., `casino-admin`)
5. Click "Autogenerate Secure Password" (save this!)
6. Set user privileges: **Read and write to any database**
7. Click "Add User"

### 4. Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. Choose **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - This allows Vercel's dynamic IPs to connect
   - Safe for read/write operations with strong passwords
4. Click "Confirm"

### 5. Get Connection String

1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your credentials
7. Add database name before the `?`:
   ```
   mongodb+srv://casino-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/casino-db?retryWrites=true&w=majority
   ```

---

## Part 2: Next.js Integration

### 1. Install Mongoose

In your Next.js project:

```bash
npm install mongoose
```

### 2. Create Database Connection Utility

Create `lib/mongodb.ts`:

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

### 3. Create Mongoose Model

Example for leaderboard (`models/Score.ts`):

```typescript
import mongoose, { Schema, Model } from 'mongoose';

export interface IScore {
  username: string;
  score: number;
  distance?: number;
  timestamp: Date;
}

const ScoreSchema = new Schema<IScore>({
  username: { type: String, required: true },
  score: { type: Number, required: true },
  distance: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

const Score: Model<IScore> = 
  mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);

export default Score;
```

### 4. Create API Route

Example (`app/api/leaderboard/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Score from '@/models/Score';

export async function GET() {
  try {
    await dbConnect();
    const scores = await Score.find({})
      .sort({ score: -1 })
      .limit(10)
      .lean();
    
    return NextResponse.json({ success: true, data: scores });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const score = await Score.create(body);
    
    return NextResponse.json({ success: true, data: score }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create score' }, { status: 400 });
  }
}
```

---

## Part 3: Vercel Integration

### 1. Add Environment Variable to Vercel

**Option A: Via Vercel Dashboard**

1. Go to your project on https://vercel.com
2. Click "Settings"
3. Select "Environment Variables"
4. Add new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your connection string
   - **Environment**: Production, Preview, Development (check all)
5. Click "Save"

**Option B: Via Vercel CLI**

```bash
vercel env add MONGODB_URI
# Paste your connection string when prompted
```

### 2. Add to Local Development

Create `.env.local` in your project root:

```env
MONGODB_URI=mongodb+srv://casino-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/casino-db?retryWrites=true&w=majority
```

**Important**: Add to `.gitignore`:
```
.env.local
.env*.local
```

### 3. Redeploy

After adding environment variables:

```bash
git add .
git commit -m "Add MongoDB integration"
git push origin master
```

Vercel will automatically redeploy with the new environment variables.

---

## Part 4: Testing Connection

### Test Locally

Create `app/api/test-db/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ success: true, message: 'MongoDB connected!' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

Run locally:
```bash
npm run dev
# Visit http://localhost:3000/api/test-db
```

### Test on Vercel

After deployment, visit:
```
https://your-app.vercel.app/api/test-db
```

---

## Security Best Practices

### 1. Use Strong Passwords
- Minimum 16 characters
- Mix of letters, numbers, symbols
- Use MongoDB's auto-generated passwords

### 2. Restrict Network Access
- If you have static IPs, whitelist only those
- For Vercel, `0.0.0.0/0` is necessary due to dynamic IPs

### 3. Environment Variables
- Never commit `.env.local` to Git
- Use different credentials for development/production
- Rotate passwords periodically

### 4. Database User Permissions
- Use read-only users for queries when possible
- Create separate users for different applications

### 5. Connection String Security
- Never expose in client-side code
- Only use in API routes or server components
- Use Vercel's encrypted environment variables

---

## Troubleshooting

### Connection Timeout
- Check network access whitelist (0.0.0.0/0 for Vercel)
- Verify connection string is correct
- Ensure cluster is running (not paused)

### Authentication Failed
- Double-check username and password
- Ensure password is URL-encoded if it contains special characters
- Verify user has correct permissions

### Environment Variable Not Found
- Check variable name matches exactly (case-sensitive)
- Redeploy after adding variables
- Verify variable is set for correct environment

### Mongoose Connection Issues
- Use the caching pattern shown above
- Avoid multiple simultaneous connections
- Close connections in serverless functions (handled by caching)

---

## Monitoring & Maintenance

### MongoDB Atlas Dashboard

Monitor your database:
1. Go to **Metrics** tab
2. View:
   - Operations per second
   - Connections
   - Network traffic
   - Storage usage

### Set Up Alerts

1. Go to **Alerts** tab
2. Create alerts for:
   - Storage usage >80%
   - Connection spikes
   - Slow queries

### Backup

Free tier includes:
- Automatic daily backups (retained 1 day)
- Point-in-time recovery available on paid tiers

---

## Cost Management

### Free Tier Limits (M0)
- 512 MB storage
- Shared RAM
- Shared vCPUs
- No backups beyond 1 day
- Community support only

### When to Upgrade
- Storage > 500 MB
- Need more connections
- Require dedicated resources
- Need advanced backups
- Want faster performance

### Estimated Costs
- **M0 (Free)**: $0/month
- **M10 (Shared)**: ~$10/month
- **M20 (Dedicated)**: ~$60/month

---

## Example Projects

### Casino Machine (Current)
- **Database Needed**: No
- **Storage**: Client-side only
- Scores reset on page refresh

### Josh's Run (Future)
- **Database Needed**: Yes
- **Collections**:
  - `scores` - Leaderboard data
  - `sessions` - User sessions (optional)
- **Estimated Storage**: <10 MB for 1000 users

---

## Quick Reference

**MongoDB Atlas**: https://cloud.mongodb.com
**Connection String Format**:
```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Vercel Environment Variables**: 
Project Settings → Environment Variables

**Mongoose Documentation**: https://mongoosejs.com

---

## Summary Checklist

- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Add database user with password
- [ ] Allow network access (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Install mongoose in project
- [ ] Create database connection utility
- [ ] Create Mongoose models
- [ ] Create API routes
- [ ] Add MONGODB_URI to Vercel
- [ ] Add MONGODB_URI to .env.local
- [ ] Test connection locally
- [ ] Deploy and test on Vercel
