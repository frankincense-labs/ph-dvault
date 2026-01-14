# Screenshot Guide for PH-DVault Documentation

## 📊 Database Screenshots

### Option 1: Table Editor View (Recommended)
1. **Login to Supabase Dashboard**: https://app.supabase.com
2. **Navigate to**: `Table Editor` (left sidebar)
3. **What to capture:**
   - All tables visible in the left panel
   - At least one table expanded showing columns
   - Screenshot should show: `profiles`, `medical_records`, `share_tokens`, `access_logs`

### Option 2: Database Schema View
1. **Navigate to**: `Database` → `Tables` (left sidebar)
2. **Click on a table** (e.g., `profiles`)
3. **What to capture:**
   - Table structure (columns, types, constraints)
   - Foreign key relationships (if visible)
   - Indexes section

### Option 3: SQL Editor with Schema
1. **Navigate to**: `SQL Editor` (left sidebar)
2. **Open**: `supabase-schema.sql` file (or paste it)
3. **What to capture:**
   - The complete schema showing all CREATE TABLE statements
   - Relationships and constraints

---

## 🔄 Data Flow Diagram (DFD)

### What to Show in DFD:

#### Level 0 (Context Diagram):
```
[User] ←→ [PH-DVault Web App] ←→ [Supabase Backend]
```

#### Level 1 (Main Processes):

1. **Authentication Flow:**
   ```
   User → Sign In/Sign Up → Supabase Auth → JWT Token → Protected Routes
   ```

2. **Data Storage Flow:**
   ```
   User → Form Input → React Frontend → Supabase API → PostgreSQL Database
   ```

3. **File Upload Flow:**
   ```
   User → File Select → React Frontend → Supabase Storage → S3/Storage Bucket
   ```

4. **Sharing Flow:**
   ```
   User → Generate Share → Create Token → Store in DB → Share Link/Code → Recipient → Access Record
   ```

### Tools to Create DFD:

1. **Draw.io** (Free, Online)
   - Go to: https://app.diagrams.net/
   - Use shapes: Rectangle (processes), Circle (data stores), Arrow (data flow)
   - Export as PNG/PDF

2. **Lucidchart** (Free tier available)
   - Professional diagrams
   - Templates for DFD

3. **Figma** (You already have this)
   - Create DFD using shapes and connectors
   - Export as image

4. **Text-based DFD** (I can help create this)
   - Simple ASCII/text representation
   - Good for documentation

---

## 📸 Specific Screenshots to Take:

### 1. Database Tables Overview
- **Location**: Supabase Dashboard → Table Editor
- **Show**: All 4 tables listed
- **Purpose**: Show database structure

### 2. Table Schema Detail
- **Location**: Supabase Dashboard → Database → Tables → Click `medical_records`
- **Show**: Columns, data types, constraints
- **Purpose**: Show detailed structure

### 3. RLS Policies
- **Location**: Supabase Dashboard → Authentication → Policies
- **Show**: Row Level Security policies for tables
- **Purpose**: Show security implementation

### 4. Storage Bucket
- **Location**: Supabase Dashboard → Storage → `medical-files` bucket
- **Show**: Bucket settings, policies
- **Purpose**: Show file storage setup

### 5. API Endpoints (Optional)
- **Location**: Supabase Dashboard → API → REST
- **Show**: Auto-generated API endpoints
- **Purpose**: Show backend API structure

---

## 🎨 DFD Example Structure

Here's a simple text-based DFD you can use or convert to visual:

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ (1) Sign In/Up
     ▼
┌─────────────────────┐
│   React Frontend    │
│  (PH-DVault App)    │
└────┬───────────┬────┘
     │           │
     │ (2)       │ (3)
     │ Auth      │ Data
     ▼           ▼
┌──────────┐  ┌──────────────┐
│ Supabase │  │  PostgreSQL  │
│   Auth   │  │   Database   │
└──────────┘  └──────────────┘
     │
     │ (4) JWT Token
     ▼
┌─────────────────────┐
│  Protected Routes   │
└─────────────────────┘

(5) File Upload Flow:
User → Frontend → Supabase Storage → S3 Bucket

(6) Sharing Flow:
User → Generate Token → Store in DB → Share Link → Recipient → Access Record
```

---

## 💡 Tips for Screenshots:

1. **Use browser zoom**: Set to 80-90% to capture more content
2. **Hide personal data**: Blur or hide any sensitive information
3. **Multiple angles**: Take screenshots from different views
4. **Annotations**: Add arrows/labels if needed (use image editor)
5. **High resolution**: Ensure screenshots are clear and readable

---

## 📝 What Each Screenshot Proves:

- **Database Tables**: Shows data structure and organization
- **Schema Details**: Shows relationships and constraints
- **RLS Policies**: Shows security implementation
- **Storage Setup**: Shows file management system
- **DFD**: Shows system architecture and data flow
