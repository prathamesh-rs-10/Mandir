# Temple Renovation Website

## Supabase configuration

The site uses Supabase for its content and admin data. Before starting the app,
create a `.env` file in the project root with the project's URL and anon key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these values from your Supabase project settings. Configure the same
variables in your hosting provider before deploying. Restart the Vite server
after changing local environment variables.

If either value is missing or the URL is invalid, the site displays a setup
message instead of failing with a blank page.
