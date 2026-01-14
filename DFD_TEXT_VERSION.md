# PH-DVault Data Flow Diagram (Text Version)

## Level 0: Context Diagram
```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (All Interactions)
     ▼
┌─────────────────────┐
│   PH-DVault Web     │
│   Application       │
│   (React Frontend)  │
└────┬───────────┬────┘
     │           │
     │ (API)     │ (Storage)
     ▼           ▼
┌──────────┐  ┌──────────────┐
│ Supabase │  │ Supabase     │
│   Auth   │  │   Storage    │
└──────────┘  └──────────────┘
     │
     │ (Data)
     ▼
┌──────────────┐
│  PostgreSQL  │
│   Database   │
└──────────────┘
```

---

## Level 1: Detailed Data Flows

### 1. Authentication Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (1) Sign In/Up Request
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (SignIn/SignUp)    │
└────┬────────────────┘
     │
     │ (2) Email/Password or OAuth
     ▼
┌──────────┐
│ Supabase │
│   Auth   │
└────┬─────┘
     │
     │ (3) Validate Credentials
     ▼
┌──────────────┐
│  PostgreSQL  │
│  (auth.users)│
└────┬─────────┘
     │
     │ (4) JWT Token
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (Protected Routes) │
└─────────────────────┘
```

### 2. Medical Record Creation Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (1) Fill Form (Add Record)
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (AddMedication,     │
│   AddAllergies, etc) │
└────┬────────────────┘
     │
     │ (2) Encrypt Data (AES-256)
     │ (3) Submit to API
     ▼
┌──────────┐
│ Supabase │
│   API    │
└────┬─────┘
     │
     │ (4) Validate & Store
     ▼
┌──────────────┐
│  PostgreSQL  │
│ medical_     │
│ records      │
└──────────────┘
```

### 3. File Upload Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (1) Select File
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (File Upload UI)   │
└────┬────────────────┘
     │
     │ (2) Generate SHA256 Hash
     │ (3) Upload File
     ▼
┌──────────────┐
│ Supabase     │
│   Storage    │
│ (S3 Bucket)  │
└────┬─────────┘
     │
     │ (4) Store File URL & Hash
     ▼
┌──────────────┐
│  PostgreSQL  │
│ medical_     │
│ records      │
│ (file_url,   │
│  file_hash)  │
└──────────────┘
```

### 4. Sharing Flow (Link/Code Generation)
```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (1) Select Records & Expiry
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (GenerateLink/     │
│   ShareCode)        │
└────┬────────────────┘
     │
     │ (2) Generate Token/Code
     │ (3) Create Share Token
     ▼
┌──────────┐
│ Supabase │
│   API    │
└────┬─────┘
     │
     │ (4) Store Share Token
     ▼
┌──────────────┐
│  PostgreSQL  │
│ share_tokens │
│ (token,      │
│  expiry,     │
│  record_ids) │
└──────────────┘
     │
     │ (5) Return Link/Code
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (Display Link/Code)│
└─────────────────────┘
```

### 5. Share Access Flow (Recipient Viewing)
```
┌──────────────┐
│  Recipient   │
│  (Doctor/    │
│   Emergency) │
└────┬─────────┘
     │
     │ (1) Enter Link/Code
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (DoctorAccess)     │
└────┬────────────────┘
     │
     │ (2) Validate Token
     ▼
┌──────────┐
│ Supabase │
│   API    │
└────┬─────┘
     │
     │ (3) Check Token Validity
     ▼
┌──────────────┐
│  PostgreSQL  │
│ share_tokens │
└────┬─────────┘
     │
     │ (4) Fetch Records
     ▼
┌──────────────┐
│  PostgreSQL  │
│ medical_     │
│ records      │
└────┬─────────┘
     │
     │ (5) Decrypt Data
     │ (6) Log Access
     ▼
┌──────────────┐
│  PostgreSQL  │
│ access_logs  │
└──────────────┘
     │
     │ (7) Return Decrypted Data
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (Display Records)  │
└─────────────────────┘
```

---

## Complete System Flow (Combined)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ [Authentication] → Supabase Auth → PostgreSQL (auth.users)
     │
     ├─→ [Create Record] → Encrypt → Supabase API → PostgreSQL (medical_records)
     │
     ├─→ [Upload File] → Hash → Supabase Storage → PostgreSQL (medical_records)
     │
     ├─→ [Share Records] → Generate Token → Supabase API → PostgreSQL (share_tokens)
     │
     └─→ [View Shared] → Validate Token → Fetch Records → Decrypt → Display
                        ↓
                   Log Access → PostgreSQL (access_logs)
```

---

## Data Stores (Database Tables)

1. **auth.users** - User authentication data (managed by Supabase)
2. **profiles** - User profile information (role, name, phone, etc.)
3. **medical_records** - Encrypted medical records
4. **share_tokens** - Generated share links/codes
5. **access_logs** - Audit trail of record access

---

## External Entities

- **User** - Patient or Doctor using the application
- **Recipient** - Doctor or Emergency personnel accessing shared records
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage service (S3)
- **PostgreSQL** - Database server

---

## Processes

1. **Authentication** - Sign in, sign up, OAuth
2. **Record Management** - Create, read, update, delete medical records
3. **File Management** - Upload, download, hash verification
4. **Sharing** - Generate and validate share tokens
5. **Access Control** - RLS policies, token validation
6. **Encryption/Decryption** - AES-256 encryption of sensitive data
