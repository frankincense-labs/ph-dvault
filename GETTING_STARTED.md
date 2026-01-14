# Getting Started with PH-DVault Development

## 🎉 What's Been Set Up

I've created the complete **backend foundation** for your PH-DVault project. Here's what's ready:

### ✅ Complete Backend Infrastructure

1. **Supabase Integration**
   - Client configuration (`src/lib/supabase.ts`)
   - Environment variables template (`.env.example`)

2. **Database Schema**
   - Complete SQL schema (`supabase-schema.sql`)
   - All tables: profiles, medical_records, share_tokens, access_logs
   - Row Level Security (RLS) policies
   - Indexes and triggers

3. **API Service Layer** (Ready to Use!)
   - `src/lib/api/auth.ts` - Authentication (sign in, sign up, OAuth)
   - `src/lib/api/records.ts` - Medical records CRUD + file upload
   - `src/lib/api/shares.ts` - Sharing system (tokens, links, codes)

4. **Utilities**
   - `src/lib/encryption.ts` - AES-256 encryption
   - `src/lib/emergency.ts` - Emergency mode helpers
   - `src/lib/queryClient.ts` - React Query setup

5. **State Management**
   - Updated `useAuthStore` with Supabase integration
   - Session management ready

6. **TypeScript Types**
   - Complete type definitions (`src/types/database.ts`)

---

## 🚀 Next Steps: Connect the UI

The **UI is already built** by Kombai. Now we need to **connect it to the backend**. Here's the recommended order:

### Step 1: Set Up Supabase (5 minutes)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy project URL and anon key
4. Create `.env` file:
   ```env
   VITE_SUPABASE_URL=your_url_here
   VITE_SUPABASE_ANON_KEY=your_key_here
   VITE_ENCRYPTION_KEY=generate_with_node_command
   ```
5. Run `supabase-schema.sql` in Supabase SQL Editor
6. Create storage bucket `medical-files` (see SETUP.md)

### Step 2: Connect Authentication (30 minutes)

**File: `src/pages/SignIn.tsx`**

```typescript
// Add these imports
import { useAuthStore } from '@/store/useAuthStore'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Add form schema
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// In component:
const { signIn } = useAuthStore()
const [error, setError] = useState<string | null>(null)
const form = useForm({ resolver: zodResolver(signInSchema) })

const onSubmit = async (data) => {
  try {
    await signIn(data.email, data.password, rememberMe)
    navigate('/dashboard')
  } catch (err) {
    setError(err.message)
  }
}
```

**Do the same for `SignUp.tsx` and `DoctorSignUp.tsx`**

### Step 3: Connect Dashboard (30 minutes)

**File: `src/pages/Dashboard.tsx`**

```typescript
// Add imports
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import * as recordsAPI from '@/lib/api/records'

// In component:
const { user } = useAuthStore()
const { data: records, isLoading } = useQuery({
  queryKey: ['records', user?.id],
  queryFn: () => recordsAPI.getRecords(user!.id),
  enabled: !!user,
})

// Replace hardcoded data with records
```

### Step 4: Connect Add Record Forms (1 hour)

**File: `src/pages/AddMedication.tsx`**

```typescript
// Add imports
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import * as recordsAPI from '@/lib/api/records'
import { useNavigate } from 'react-router-dom'

// In component:
const { user } = useAuthStore()
const navigate = useNavigate()

const mutation = useMutation({
  mutationFn: (data) => recordsAPI.createRecord(user!.id, {
    category: 'medications',
    ...data,
  }),
  onSuccess: () => {
    navigate('/dashboard')
    // Show success toast
  },
})

// Connect form submit to mutation.mutate()
```

**Repeat for other Add pages**

### Step 5: Connect Sharing (1 hour)

**File: `src/pages/Share.tsx`**

```typescript
// Fetch active shares
const { data: activeShares } = useQuery({
  queryKey: ['shares', user?.id],
  queryFn: () => sharesAPI.getActiveShares(user!.id),
})

// Implement revoke
const revokeMutation = useMutation({
  mutationFn: (shareId) => sharesAPI.revokeShare(shareId, user!.id),
})
```

---

## 📚 Available API Functions

All these are ready to use! Just import and call:

### Authentication
```typescript
import * as authAPI from '@/lib/api/auth'

await authAPI.signUp({ email, password, full_name, role })
await authAPI.signIn({ email, password })
await authAPI.signOut()
await authAPI.signInWithGoogle()
```

### Records
```typescript
import * as recordsAPI from '@/lib/api/records'

await recordsAPI.getRecords(userId)
await recordsAPI.createRecord(userId, recordData)
await recordsAPI.updateRecord(recordId, userId, updates)
await recordsAPI.deleteRecord(recordId, userId)
await recordsAPI.uploadFile(userId, file, category)
```

### Sharing
```typescript
import * as sharesAPI from '@/lib/api/shares'

await sharesAPI.createShare(userId, { method, record_ids })
await sharesAPI.getShareByToken(token)
await sharesAPI.getActiveShares(userId)
await sharesAPI.revokeShare(shareId, userId)
```

---

## 🎯 Quick Wins

1. **Start with SignIn** - Easiest to test
2. **Then Dashboard** - See real data
3. **Then one Add form** - Test full CRUD
4. **Then Sharing** - Complete the flow

---

## 📖 Documentation

- **SETUP.md** - Complete setup instructions
- **IMPLEMENTATION_STATUS.md** - What's done, what's next
- **This file** - Quick start guide

---

## 💡 Tips

1. **Use React Query** - Already set up, use `useQuery` and `useMutation`
2. **Error Handling** - Wrap API calls in try/catch
3. **Loading States** - Use `isLoading` from React Query
4. **Form Validation** - Use React Hook Form + Zod (already installed)
5. **Toast Notifications** - Consider adding a toast library (react-hot-toast)

---

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**
→ Create `.env` file with your Supabase credentials

**"Failed to create user"**
→ Check Supabase project is active and schema is run

**"RLS policy violation"**
→ Check user is authenticated and policies are correct

---

## 🎨 UI is Ready!

Remember: **All the UI is already built**. You just need to:
1. Connect forms to API functions
2. Replace hardcoded data with real data
3. Add loading/error states
4. Add success notifications

The hard part (backend, API, types) is **done**! 🎉

---

**Ready to start? Begin with Step 1 (Supabase setup) and then Step 2 (Connect SignIn)!**
