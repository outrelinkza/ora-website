# Website Routing Setup

This website uses Vercel routing to serve privacy policy and terms of service at clean URLs.

## URLs

- **Privacy Policy**: `https://myora.co/privacy-policy`
- **Terms of Service**: `https://myora.co/terms-of-service`

## How It Works

The `vercel.json` file contains rewrite rules that map:
- `/privacy-policy` → `/privacy.html`
- `/terms-of-service` → `/terms.html`

## Deployment

When deploying to Vercel:

1. **Make sure `vercel.json` is in the root** of your website directory
2. **Deploy as usual** - Vercel will automatically use the routing configuration
3. **Test the URLs** after deployment:
   - Visit `https://myora.co/privacy-policy`
   - Visit `https://myora.co/terms-of-service`

## Stripe Integration

These URLs are automatically used in Stripe Checkout sessions:
- Stripe will display links to these pages in the checkout flow
- Terms acceptance is required before payment
- Privacy policy is linked in the checkout footer

## Testing Locally

To test routing locally, you'll need to use a simple HTTP server that supports rewrites, or test directly on Vercel preview deployments.

For basic local testing:
```bash
python3 -m http.server 3000
```

Then visit:
- `http://localhost:3000/privacy.html` (works)
- `http://localhost:3000/privacy-policy` (may not work without server rewrite support)

**Note**: Full routing will work on Vercel deployment.

