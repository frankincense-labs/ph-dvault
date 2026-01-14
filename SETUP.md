# PH-DVault Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
3. **Git** (optional, for version control)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. **Create a new Supabase project** at [app.supabase.com](https://app.supabase.com)

2. **Get your project credentials:**
   - Go to Project Settings > API
   - Copy your `Project URL` and `anon/public` key

3. **Run the database schema:**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL script

4. **Create Storage Bucket:**
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `medical-files`
   - Set it to **Private** (not public)
   - Set file size limit to 10MB (or your preferred limit)

5. **Set up Storage Policies:**
   - Go to Storage > Policies for `medical-files` bucket
   - Add policy: "Users can upload their own files"
     ```sql
     CREATE POLICY "Users can upload their own files"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
     ```
   - Add policy: "Users can view their own files"
     ```sql
     CREATE POLICY "Users can view their own files"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
     ```
   - Add policy: "Users can delete their own files"
     ```sql
     CREATE POLICY "Users can delete their own files"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
     ```

## Step 3: Configure Environment Variables

1. **Create `.env` file** in the root directory:

```bash
cp .env.example .env
```

2. **Fill in your Supabase credentials:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ENCRYPTION_KEY=your_base64_encoded_32_byte_key
```

3. **Generate Encryption Key** (for production):
   ```bash
   # Generate a 32-byte key and encode to base64
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Copy the output to `VITE_ENCRYPTION_KEY`

## Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 5: Test the Setup

1. **Sign Up** - Create a new patient account
2. **Sign In** - Test authentication
3. **Add a Record** - Test record creation
4. **Upload a File** - Test file upload functionality

## Project Structure

```
ph-d-vault/
├── src/
│   ├── lib/
│   │   ├── api/          # API service functions
│   │   ├── supabase.ts   # Supabase client
│   │   ├── encryption.ts # AES-256 encryption
│   │   └── emergency.ts  # Emergency mode utilities
│   ├── types/
│   │   └── database.ts   # TypeScript types
│   ├── store/
│   │   └── useAuthStore.ts # Zustand auth store
│   ├── components/       # React components
│   └── pages/            # Page components
├── supabase-schema.sql   # Database schema
└── .env                  # Environment variables
```

## Next Steps

After setup, you can:

1. **Connect forms to backend** - Update form components to use API functions
2. **Implement sharing** - Connect share pages to sharing API
3. **Add encryption** - Encrypt sensitive data before storage
4. **Implement emergency mode** - Add offline access page
5. **Add offline sync** - Implement service workers for offline support

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists and has correct values
- Restart the dev server after creating `.env`

### "Failed to create user"
- Check Supabase project is active
- Verify database schema was run successfully
- Check Supabase logs for errors

### "Storage upload failed"
- Verify `medical-files` bucket exists
- Check storage policies are set correctly
- Verify file size is within limits

### "RLS policy violation"
- Check Row Level Security policies in database
- Verify user is authenticated
- Check user_id matches in queries

## Production Deployment

1. **Set up production Supabase project**
2. **Update environment variables** for production
3. **Build the app:**
   ```bash
   npm run build
   ```
4. **Deploy** to Vercel, Netlify, or your preferred hosting

## Security Notes

- ⚠️ **Never commit `.env` file** to version control
- ⚠️ **Use strong encryption keys** in production
- ⚠️ **Enable 2FA** on Supabase account
- ⚠️ **Review RLS policies** before production
- ⚠️ **Set up proper CORS** policies
