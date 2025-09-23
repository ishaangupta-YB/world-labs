# 🚀 Complete R2 + Cloudflare Pages Deployment Guide

## Step-by-Step Process

### ✅ Step 1: Create R2 Bucket
1. **Cloudflare Dashboard** → **R2 Object Storage** → **Create bucket**
2. **Bucket name**: `spark-physics-assets` (or your choice)
3. **Location**: Auto or closest to your users
4. **Enable Public Access**: Settings → Public access → **Allow Access**
5. **Note your bucket URL**: `https://pub-xxxxxxxxxxxxx.r2.dev`

### ✅ Step 2: Configure CORS (Critical!)
In your R2 bucket settings → **CORS policy**, add:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

### ✅ Step 3: Upload Large Assets to R2
Upload these files to your R2 bucket:
- `ancient.spz` (30MB)
- `cooper_station.spz` (29MB)
- `dis1.spz` (29MB)
- `mountain.spz` (31MB)
- `rome.spz` (30MB)
- `temple.spz` (29MB)

**Via Dashboard**: Drag & drop into bucket
**Via Wrangler CLI**:
```bash
wrangler r2 object put spark-physics-assets/ancient.spz --file=dist/ancient.spz
wrangler r2 object put spark-physics-assets/cooper_station.spz --file=dist/cooper_station.spz
wrangler r2 object put spark-physics-assets/dis1.spz --file=dist/dis1.spz
wrangler r2 object put spark-physics-assets/mountain.spz --file=dist/mountain.spz
wrangler r2 object put spark-physics-assets/rome.spz --file=dist/rome.spz
wrangler r2 object put spark-physics-assets/temple.spz --file=dist/temple.spz
```

### ✅ Step 4: Update Configuration
**IMPORTANT**: Edit `src/config.js` and replace `YOUR-BUCKET-URL`:
```javascript
// Replace with your actual R2 bucket URL
export const R2_BUCKET_URL = 'https://pub-xxxxxxxxxxxxx.r2.dev';
```

**Status**: ✅ COMPLETED - All JavaScript files updated to use `getAssetUrl()`

### ✅ Step 5: Build Project
```bash
npm run build
```

### ✅ Step 6: Remove Large Files from Dist
```bash
# Remove the large .spz files from dist/ (they're now in R2)
rm dist/*.spz
```

### ✅ Step 7: Create Deployment Zip
Create a zip file containing **ONLY** these files from `dist/`:

**✅ Include:**
- All `.html` files (index.html, ancient.html, etc.)
- `assets/` folder (JS/CSS bundles)
- `_headers` file (for WASM support)
- `_redirects` file (for SPA routing)
- `.webp` preview images
- Any other small assets

**❌ Don't Include:**
- `.spz` files (now in R2)
- Source files (`src/`)
- Config files (`package.json`, etc.)

**Final zip size should be ~10-15MB** instead of 190MB!

### ✅ Step 8: Deploy to Cloudflare Pages
1. **Cloudflare Dashboard** → **Pages** → **Create a project**
2. **Upload assets** → Upload your zip file
3. **Deploy!**

## 🔧 Configuration Details

### Files Modified:
- `src/config.js` - R2 configuration
- All world JS files - Updated to use `getAssetUrl()`
- Build process - Excludes large files

### R2 URLs:
Your assets will be served from:
```
https://pub-xxxxxxxxxxxxx.r2.dev/ancient.spz
https://pub-xxxxxxxxxxxxx.r2.dev/cooper_station.spz
https://pub-xxxxxxxxxxxxx.r2.dev/dis1.spz
https://pub-xxxxxxxxxxxxx.r2.dev/mountain.spz
https://pub-xxxxxxxxxxxxx.r2.dev/rome.spz
https://pub-xxxxxxxxxxxxx.r2.dev/temple.spz
```

## 🧪 Testing
After deployment, test one world to ensure:
1. ✅ Page loads without errors
2. ✅ Console shows R2 URLs being fetched
3. ✅ 3D world renders correctly
4. ✅ No CORS errors

## 💰 Cost Benefits
- **R2 Storage**: ~$0.015/GB/month for 180MB = ~$0.003/month
- **R2 Bandwidth**: Free egress to Cloudflare
- **Pages**: Free tier covers your site
- **Total**: ~$0.003/month instead of deployment issues!

## 🔍 Troubleshooting
- **CORS errors**: Check R2 bucket CORS policy
- **404 on assets**: Verify R2 bucket URL in config.js
- **Build errors**: Ensure config.js import path is correct
- **Large zip**: Make sure .spz files are removed from dist/