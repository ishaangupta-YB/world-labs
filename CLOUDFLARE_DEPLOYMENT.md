# Cloudflare Pages Deployment Guide

This project has been configured to deploy to Cloudflare Pages with full WASM and SharedArrayBuffer support.

## Quick Deployment

### Option 1: Git Integration (Recommended)
1. Push your code to GitHub/GitLab
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Build settings will be auto-detected:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 18

### Option 2: Direct Deploy with Wrangler
```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy

# Or step by step:
npm run build
npx wrangler pages deploy dist
```

## Configuration Files

- **`wrangler.toml`**: Cloudflare Pages configuration
- **`public/_headers`**: Cross-origin headers for WASM/SharedArrayBuffer support
- **`public/_redirects`**: SPA routing fallback
- **`package.json`**: Added deployment scripts and wrangler dependency

## Key Features Enabled

✅ **WASM Support**: Proper MIME types and headers for WebAssembly files
✅ **SharedArrayBuffer**: Cross-origin isolation headers (COOP/COEP)
✅ **SPA Routing**: Fallback to index.html for client-side routing
✅ **Asset Caching**: Optimized caching for .spz files (1 year)
✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options

## Domain Setup

1. **Custom Domain**: Add your domain in Pages → Custom domains
2. **DNS**: Update your CNAME to point to your-project.pages.dev
3. **SSL**: Automatically provisioned by Cloudflare

## Differences from Netlify

| Feature | Netlify | Cloudflare Pages |
|---------|---------|------------------|
| Protocol | HTTP/2 | HTTP/3 |
| Bandwidth | 100GB/month (free) | Unlimited (free) |
| Build minutes | 300/month (free) | 500/month (free) |
| Functions | Netlify Functions | Pages Functions |
| Headers | `netlify.toml` | `_headers` file |
| Redirects | `netlify.toml` | `_redirects` file |

## Troubleshooting

### WASM/SharedArrayBuffer Issues
If you get "SharedArrayBuffer is not defined" errors:
1. Ensure `_headers` file is in your build output (`dist/`)
2. Check browser dev tools → Network → Response Headers
3. Verify these headers are present:
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build
npm run pages:dev  # Local preview with Cloudflare Pages
```

## Monitoring

- **Analytics**: Available in Cloudflare Dashboard → Pages → Analytics
- **Logs**: Real-time function logs in dashboard
- **Performance**: Built-in Web Vitals monitoring

Your site will be available at `https://your-project.pages.dev` after deployment.