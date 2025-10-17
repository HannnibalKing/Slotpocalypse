# Deployment Guide

## Vercel Deployment (Recommended)

This Next.js application is optimized for deployment on Vercel's platform.

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Code pushed to GitHub repository

### Deployment Steps

1. **Access Vercel Dashboard**
   - Navigate to https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your repository: `HannnibalKing/Slotpocalypse`
   - Click "Import"

3. **Configure Build Settings**
   
   Vercel will auto-detect the Next.js configuration:
   
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
   - **Node.js Version**: 18.x or higher

4. **Deploy**
   - Click "Deploy" button
   - Wait for build process (typically 2-3 minutes)
   - Receive your live URL

### Automatic Deployments

Once configured, Vercel automatically deploys:
- **Production**: Every push to `master` branch
- **Preview**: Every pull request gets a unique preview URL

### Environment Variables

If needed in the future, add environment variables in:
- Vercel Dashboard → Project Settings → Environment Variables

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Build Output

Expected build artifacts:
- Static pages in `.next/static/`
- Server functions in `.next/server/`
- Public assets in `public/`

### Performance Optimization

The application includes:
- Automatic code splitting
- Image optimization via Next.js Image component
- Static asset caching
- Edge network distribution

### Monitoring

Access deployment logs and analytics:
- Vercel Dashboard → Project → Deployments
- Real-time build logs
- Runtime logs
- Performance analytics

### Rollback

To revert to a previous deployment:
1. Go to Deployments tab
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

### Support

For deployment issues:
- Check build logs in Vercel dashboard
- Review Next.js documentation: https://nextjs.org/docs
- Vercel documentation: https://vercel.com/docs

---

## Alternative Hosting Options

### Netlify
- Similar process to Vercel
- Connect GitHub repository
- Auto-detect Next.js configuration
- Deploy

### Self-Hosted (VPS/Cloud)

**Requirements:**
- Node.js 18.x or higher
- PM2 or similar process manager

**Build Steps:**
```bash
npm install
npm run build
npm start
```

**Using PM2:**
```bash
pm2 start npm --name "casino-machine" -- start
pm2 save
pm2 startup
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t casino-machine .
docker run -p 3000:3000 casino-machine
```

---

## Post-Deployment Checklist

- [ ] Verify game loads correctly
- [ ] Test slot machine spin functionality
- [ ] Check responsive design on mobile
- [ ] Verify animations and sound effects
- [ ] Test responsible gaming features
- [ ] Monitor initial performance metrics
- [ ] Set up custom domain (if desired)
- [ ] Configure analytics (if desired)

## Troubleshooting

### Build Fails
- Check Node.js version (18.x+ required)
- Verify all dependencies in package.json
- Review build logs for specific errors

### Game Not Loading
- Check browser console for errors
- Verify Phaser.js loaded correctly
- Ensure WebGL is supported in browser

### Performance Issues
- Enable production mode
- Check asset optimization
- Review network tab for large files
- Consider CDN for static assets

---

**Current Repository**: https://github.com/HannnibalKing/Slotpocalypse
