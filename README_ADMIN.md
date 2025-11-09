# ORA Admin Dashboard

## Access
Visit: `https://myora.co/admin`

## Authentication
Default password: `ora_admin_2025`

**Important**: Change this in production by setting `ADMIN_PASSWORD` environment variable in Vercel.

## Features

### Overview Tab
- Quick stats: Rate submissions, bug reports, active users, total submissions
- Recent activity feed

### Submissions Tab
- View all rate submissions and bug reports
- Filter by type (All, Rates, Bugs)
- See user email and submission details

### Analytics Tab
- Total users and paid users
- Subscription revenue (from Stripe)
- Conversion rate
- Platform distribution

### Errors Tab
- Error monitoring stats
- Recent error reports
- Error severity breakdown

## API Endpoints

All endpoints require authentication via `token` query parameter or `x-admin-token` header.

- `GET /api/admin/overview` - Overview statistics
- `GET /api/admin/submissions?filter=all|rates|bugs` - Filtered submissions
- `GET /api/admin/analytics` - User and subscription analytics
- `GET /api/admin/errors` - Error monitoring data
- `POST /api/admin/auth` - Admin authentication

## Environment Variables

Set these in Vercel Dashboard:

```
ADMIN_PASSWORD=your_secure_password_here
ADMIN_TOKEN=your_secure_token_here (optional, defaults to ADMIN_PASSWORD)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Database Tables Required

The admin dashboard connects to these Supabase tables:

- `submissions` - Rate submissions and bug reports
- `profiles` - User profiles
- `subscriptions` - User subscriptions
- `error_reports` - Error monitoring (optional)

If tables don't exist yet, the API will return empty data gracefully.

## Security Notes

1. **Change the default password** in production
2. Use `SUPABASE_SERVICE_ROLE_KEY` for admin access (bypasses RLS)
3. Consider adding IP whitelisting for additional security
4. The admin token is stored in localStorage - clear it on logout

