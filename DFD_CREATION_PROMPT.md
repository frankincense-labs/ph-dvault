# DFD Creation Prompt for Draw.io / Figma

## Instructions for Draw.io (https://app.diagrams.net/)

### Step 1: Create New Diagram
1. Go to https://app.diagrams.net/
2. Click "Create New Diagram"
3. Choose "Blank Diagram"
4. Name it "PH-DVault Data Flow Diagram"

### Step 2: Use These Shapes
- **Rectangle** = Process (Frontend, API, etc.)
- **Circle** = Data Store (Database tables)
- **Arrow** = Data Flow
- **Rounded Rectangle** = External Entity (User)

### Step 3: Create Level 0 (Context Diagram)

**Elements to Add:**
1. **External Entity:**
   - Label: "User"
   - Shape: Rounded Rectangle
   - Color: Light Blue

2. **Process:**
   - Label: "PH-DVault Web App\n(React Frontend)"
   - Shape: Rectangle
   - Color: Light Green

3. **Data Stores:**
   - Label: "Supabase Auth"
   - Label: "Supabase Storage"
   - Label: "PostgreSQL Database"
   - Shape: Circle (open on right side)
   - Color: Light Yellow

**Connections (Arrows):**
- User → PH-DVault Web App (label: "All Interactions")
- PH-DVault Web App → Supabase Auth (label: "Authentication")
- PH-DVault Web App → Supabase Storage (label: "File Upload")
- PH-DVault Web App → PostgreSQL Database (label: "Data Operations")
- Supabase Auth → PostgreSQL Database (label: "User Data")

---

### Step 4: Create Level 1 - Authentication Flow

**Elements:**
1. **External Entity:** "User"
2. **Process:** "Sign In/Sign Up Page"
3. **Process:** "Supabase Auth Service"
4. **Data Store:** "auth.users (PostgreSQL)"
5. **Process:** "Protected Routes"

**Flow:**
```
User → Sign In/Sign Up → Supabase Auth → auth.users → JWT Token → Protected Routes
```

**Labels on Arrows:**
- "1. Sign In Request"
- "2. Validate Credentials"
- "3. Check User"
- "4. Return JWT Token"
- "5. Authenticated Access"

---

### Step 5: Create Level 1 - Record Creation Flow

**Elements:**
1. **External Entity:** "User"
2. **Process:** "Add Record Form"
3. **Process:** "Encryption Service (AES-256)"
4. **Process:** "Supabase API"
5. **Data Store:** "medical_records"

**Flow:**
```
User → Add Record Form → Encryption → Supabase API → medical_records
```

**Labels:**
- "1. Fill Form"
- "2. Encrypt Data"
- "3. Submit to API"
- "4. Store Encrypted Record"

---

### Step 6: Create Level 1 - File Upload Flow

**Elements:**
1. **External Entity:** "User"
2. **Process:** "File Upload UI"
3. **Process:** "Hash Generator (SHA256)"
4. **Data Store:** "Supabase Storage (S3)"
5. **Data Store:** "medical_records"

**Flow:**
```
User → File Upload UI → Hash Generator → Supabase Storage
                                    ↓
                            medical_records (store URL & hash)
```

**Labels:**
- "1. Select File"
- "2. Generate Hash"
- "3. Upload File"
- "4. Store File URL & Hash"

---

### Step 7: Create Level 1 - Sharing Flow

**Elements:**
1. **External Entity:** "User"
2. **Process:** "Generate Link/Code"
3. **Process:** "Token Generator"
4. **Data Store:** "share_tokens"
5. **External Entity:** "Recipient"

**Flow:**
```
User → Generate Link/Code → Token Generator → share_tokens
                                    ↓
                            Return Link/Code → Recipient
```

**Labels:**
- "1. Select Records & Expiry"
- "2. Generate Token"
- "3. Store Share Token"
- "4. Return Link/Code"
- "5. Share with Recipient"

---

### Step 8: Create Level 1 - Share Access Flow

**Elements:**
1. **External Entity:** "Recipient"
2. **Process:** "Enter Link/Code"
3. **Process:** "Token Validator"
4. **Data Store:** "share_tokens"
5. **Data Store:** "medical_records"
6. **Process:** "Decryption Service"
7. **Data Store:** "access_logs"

**Flow:**
```
Recipient → Enter Link/Code → Token Validator → share_tokens
                                        ↓
                                medical_records → Decryption → Display
                                        ↓
                                access_logs (log access)
```

**Labels:**
- "1. Enter Token"
- "2. Validate Token"
- "3. Check Validity"
- "4. Fetch Records"
- "5. Decrypt Data"
- "6. Log Access"
- "7. Display Records"

---

## Color Scheme Suggestions

- **External Entities (User):** #E3F2FD (Light Blue)
- **Processes (Frontend/API):** #E8F5E9 (Light Green)
- **Data Stores (Database):** #FFF9C4 (Light Yellow)
- **Arrows:** #424242 (Dark Gray)
- **Text:** #212121 (Dark Gray)

---

## Figma Alternative Instructions

### For Figma:
1. Create a new Figma file
2. Use **Frames** for processes
3. Use **Ellipses** for data stores
4. Use **Rounded Rectangles** for external entities
5. Use **Arrows** (Line tool with arrowhead) for flows
6. Add **Text** labels on arrows
7. Use **Auto Layout** for better organization

### Figma Components:
- Create a component library:
  - "External Entity" component
  - "Process" component
  - "Data Store" component
  - "Flow Arrow" component

---

## Quick Copy-Paste Prompt for AI Tools

If using AI to generate the diagram, use this prompt:

```
Create a Data Flow Diagram (DFD) for PH-DVault, a personal health data vault application.

Level 0 Context Diagram:
- External Entity: User
- Process: PH-DVault Web App (React Frontend)
- Data Stores: Supabase Auth, Supabase Storage, PostgreSQL Database
- Show all connections with labeled arrows

Level 1 Detailed Flows:
1. Authentication Flow: User → Sign In → Supabase Auth → auth.users → JWT → Protected Routes
2. Record Creation: User → Form → Encryption → Supabase API → medical_records
3. File Upload: User → Upload UI → Hash → Storage → medical_records
4. Sharing: User → Generate → Token → share_tokens → Link/Code → Recipient
5. Share Access: Recipient → Token → Validator → share_tokens → medical_records → Decrypt → Display → access_logs

Use standard DFD notation:
- Rounded rectangles for external entities
- Rectangles for processes
- Open circles for data stores
- Arrows with labels for data flows

Color scheme: Light blue for entities, light green for processes, light yellow for data stores.
```

---

## Final Checklist

- [ ] Level 0 Context Diagram created
- [ ] All 5 Level 1 flows created
- [ ] All arrows labeled with flow numbers/descriptions
- [ ] Color scheme applied consistently
- [ ] Legend/key added
- [ ] Title and date added
- [ ] Export as PNG/PDF for documentation
