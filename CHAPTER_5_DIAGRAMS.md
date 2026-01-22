# Chapter 5: Implementation Diagrams

This document contains the technical diagrams for PH-DVault system implementation.

---

## 5.9 Sequence Diagrams

### 5.9.1 User Authentication Sequence

```
┌──────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   User   │          │   Frontend  │          │  Supabase    │          │  PostgreSQL │
│          │          │   (React)   │          │    Auth      │          │  Database   │
└────┬─────┘          └──────┬──────┘          └──────┬───────┘          └──────┬──────┘
     │                       │                        │                         │
     │  1. Enter credentials │                        │                         │
     │──────────────────────>│                        │                         │
     │                       │                        │                         │
     │                       │  2. signUp(email, pw)  │                         │
     │                       │───────────────────────>│                         │
     │                       │                        │                         │
     │                       │                        │  3. Create user         │
     │                       │                        │────────────────────────>│
     │                       │                        │                         │
     │                       │                        │  4. Insert profile      │
     │                       │                        │  (via trigger)          │
     │                       │                        │────────────────────────>│
     │                       │                        │                         │
     │                       │  5. Send OTP email     │                         │
     │                       │<───────────────────────│                         │
     │                       │                        │                         │
     │  6. Display OTP page  │                        │                         │
     │<──────────────────────│                        │                         │
     │                       │                        │                         │
     │  7. Enter 8-digit OTP │                        │                         │
     │──────────────────────>│                        │                         │
     │                       │                        │                         │
     │                       │  8. verifyOtp(token)   │                         │
     │                       │───────────────────────>│                         │
     │                       │                        │                         │
     │                       │                        │  9. Validate token      │
     │                       │                        │────────────────────────>│
     │                       │                        │                         │
     │                       │  10. Return session    │                         │
     │                       │<───────────────────────│                         │
     │                       │                        │                         │
     │  11. Redirect to      │                        │                         │
     │      Dashboard        │                        │                         │
     │<──────────────────────│                        │                         │
     │                       │                        │                         │
```

### 5.9.2 Medical Record Creation Sequence

```
┌──────────┐       ┌─────────────┐       ┌────────────┐       ┌─────────────┐       ┌──────────────┐
│   User   │       │   Frontend  │       │ Encryption │       │  Supabase   │       │  PostgreSQL  │
│          │       │   (React)   │       │   Module   │       │   Storage   │       │   Database   │
└────┬─────┘       └──────┬──────┘       └─────┬──────┘       └──────┬──────┘       └──────┬───────┘
     │                    │                    │                     │                     │
     │ 1. Fill form +     │                    │                     │                     │
     │    attach file     │                    │                     │                     │
     │───────────────────>│                    │                     │                     │
     │                    │                    │                     │                     │
     │                    │ 2. If file exists: │                     │                     │
     │                    │    Calculate SHA256│                     │                     │
     │                    │───────────────────>│                     │                     │
     │                    │                    │                     │                     │
     │                    │                    │  3. Upload file     │                     │
     │                    │                    │────────────────────>│                     │
     │                    │                    │                     │                     │
     │                    │                    │  4. Return file URL │                     │
     │                    │                    │<────────────────────│                     │
     │                    │                    │                     │                     │
     │                    │ 5. Encrypt         │                     │                     │
     │                    │    sensitive data  │                     │                     │
     │                    │───────────────────>│                     │                     │
     │                    │                    │                     │                     │
     │                    │ 6. Return          │                     │                     │
     │                    │    encrypted blob  │                     │                     │
     │                    │<───────────────────│                     │                     │
     │                    │                    │                     │                     │
     │                    │                    │  7. INSERT record   │                     │
     │                    │                    │  (encrypted_data,   │                     │
     │                    │                    │   file_url, hash)   │                     │
     │                    │                    │────────────────────────────────────────>│
     │                    │                    │                     │                     │
     │                    │                    │                     │  8. Log access      │
     │                    │                    │                     │  (action: create)   │
     │                    │                    │                     │────────────────────>│
     │                    │                    │                     │                     │
     │ 9. Show success    │                    │                     │                     │
     │<───────────────────│                    │                     │                     │
     │                    │                    │                     │                     │
```

### 5.9.3 Record Sharing Sequence (Patient to Doctor)

```
┌─────────┐       ┌─────────────┐       ┌──────────────┐       ┌─────────┐       ┌─────────────┐
│ Patient │       │   Frontend  │       │  PostgreSQL  │       │ Doctor  │       │   Frontend  │
│         │       │   (React)   │       │   Database   │       │         │       │   (React)   │
└────┬────┘       └──────┬──────┘       └──────┬───────┘       └────┬────┘       └──────┬──────┘
     │                   │                     │                    │                   │
     │ 1. Select records │                     │                    │                   │
     │    + expiry time  │                     │                    │                   │
     │──────────────────>│                     │                    │                   │
     │                   │                     │                    │                   │
     │                   │ 2. Generate token   │                    │                   │
     │                   │    + 5-digit PIN    │                    │                   │
     │                   │                     │                    │                   │
     │                   │ 3. INSERT share_    │                    │                   │
     │                   │    tokens           │                    │                   │
     │                   │────────────────────>│                    │                   │
     │                   │                     │                    │                   │
     │                   │ 4. Log access       │                    │                   │
     │                   │    (action: share)  │                    │                   │
     │                   │────────────────────>│                    │                   │
     │                   │                     │                    │                   │
     │ 5. Display link   │                     │                    │                   │
     │    + PIN          │                     │                    │                   │
     │<──────────────────│                     │                    │                   │
     │                   │                     │                    │                   │
     │ 6. Share link+PIN │                     │                    │                   │
     │    with doctor    │                     │                    │                   │
     │─────────────────────────────────────────────────────────────>│                   │
     │                   │                     │                    │                   │
     │                   │                     │                    │ 7. Open link      │
     │                   │                     │                    │──────────────────>│
     │                   │                     │                    │                   │
     │                   │                     │ 8. Validate token  │                   │
     │                   │                     │<───────────────────────────────────────│
     │                   │                     │                    │                   │
     │                   │                     │                    │ 9. Prompt for PIN │
     │                   │                     │                    │<──────────────────│
     │                   │                     │                    │                   │
     │                   │                     │                    │ 10. Enter PIN     │
     │                   │                     │                    │──────────────────>│
     │                   │                     │                    │                   │
     │                   │                     │ 11. Verify PIN     │                   │
     │                   │                     │<───────────────────────────────────────│
     │                   │                     │                    │                   │
     │                   │                     │ 12. SELECT records │                   │
     │                   │                     │    WHERE id IN     │                   │
     │                   │                     │    (record_ids)    │                   │
     │                   │                     │────────────────────────────────────────│
     │                   │                     │                    │                   │
     │                   │                     │ 13. UPDATE token   │                   │
     │                   │                     │    (accessed_at,   │                   │
     │                   │                     │     accessed_by)   │                   │
     │                   │                     │────────────────────────────────────────│
     │                   │                     │                    │                   │
     │                   │                     │ 14. Log access     │                   │
     │                   │                     │    (access_shared) │                   │
     │                   │                     │────────────────────────────────────────│
     │                   │                     │                    │                   │
     │                   │                     │                    │ 15. Display       │
     │                   │                     │                    │     patient data  │
     │                   │                     │                    │<──────────────────│
     │                   │                     │                    │                   │
```

---

## 5.10 Administrative Verification Workflow Diagram

### Doctor MDCN Verification Process

```
                                    ┌─────────────────────┐
                                    │   Doctor Signs Up   │
                                    │  (enters MDCN no.)  │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Profile Created    │
                                    │  verification_      │
                                    │  status: 'pending'  │
                                    └──────────┬──────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
               ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
               │  AUTO MATCHING   │ │  MANUAL REVIEW   │ │   EDGE FUNCTION  │
               │  (Future: MDCN   │ │  (Admin Portal)  │ │   (Scheduled)    │
               │   API check)     │ │                  │ │                  │
               └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                        │                    │                    │
                        │                    ▼                    │
                        │         ┌──────────────────┐            │
                        │         │   Admin Reviews  │            │
                        │         │   Doctor Info    │            │
                        │         └────────┬─────────┘            │
                        │                  │                      │
                        ▼                  ▼                      ▼
               ┌──────────────────────────────────────────────────────────┐
               │                    VERIFICATION DECISION                 │
               └────────────────────────────┬─────────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   AUTO_MATCHED   │    │     VERIFIED     │    │     REJECTED     │
         │  (MDCN exists    │    │  (Admin approved │    │  (Invalid MDCN   │
         │   in registry)   │    │   after review)  │    │   or fraud)      │
         └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                  │                       │                       │
                  ▼                       ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │  Full Access     │    │  Full Access     │    │  Limited Access  │
         │  to Patient      │    │  to Patient      │    │  (Cannot view    │
         │  Shared Records  │    │  Shared Records  │    │  shared records) │
         └──────────────────┘    └──────────────────┘    └──────────────────┘


Database Fields:
  - verification_status: 'pending' | 'auto_matched' | 'verified' | 'rejected'
  - verified_at: TIMESTAMPTZ (when verification occurred)
  - mdcn_number: TEXT UNIQUE (Medical & Dental Council of Nigeria number)
```

---

## 5.11 Verification State Machine

### State Transitions for Doctor Verification

```
                              ┌─────────────────────────────────────────────┐
                              │                                             │
                              │            VERIFICATION STATES              │
                              │                                             │
                              └─────────────────────────────────────────────┘

     ┌─────────────┐
     │   START     │
     │  (Sign Up)  │
     └──────┬──────┘
            │
            │ Doctor submits MDCN number
            ▼
    ┌───────────────┐
    │               │
    │   PENDING     │◄──────────────────────────────────────────────────┐
    │               │                                                   │
    └───────┬───────┘                                                   │
            │                                                           │
            │                                                           │
    ┌───────┴───────────────────────────────────┐                       │
    │                                           │                       │
    │ MDCN API Check         Admin Manual       │                       │
    │ (if available)         Review             │                       │
    ▼                        ▼                  │                       │
┌───────────────┐    ┌───────────────┐          │                       │
│               │    │               │          │                       │
│ AUTO_MATCHED  │    │   VERIFIED    │          │          Resubmit     │
│               │    │               │          │          with new     │
└───────┬───────┘    └───────┬───────┘          │          MDCN number  │
        │                    │                  │                       │
        │                    │                  │                       │
        │                    │          ┌───────┴───────┐               │
        │                    │          │               │               │
        │                    │          │   REJECTED    │───────────────┘
        │                    │          │               │
        │                    │          └───────────────┘
        │                    │                  │
        ▼                    ▼                  │
┌─────────────────────────────────────┐        │
│                                     │        │
│        FULL ACCESS GRANTED          │        │
│                                     │        │
│  - Can access shared patient data   │        │
│  - Can view medical records         │        │
│  - Access logged for audit          │        │
│                                     │        │
└─────────────────────────────────────┘        │
                                               │
                                               ▼
                                    ┌───────────────────┐
                                    │                   │
                                    │  ACCESS DENIED    │
                                    │                   │
                                    │ - Cannot access   │
                                    │   shared records  │
                                    │ - Must resubmit   │
                                    │   for review      │
                                    │                   │
                                    └───────────────────┘


State Transition Table:
┌─────────────────┬─────────────────────┬─────────────────┬──────────────────────────┐
│  Current State  │       Event         │   Next State    │         Action           │
├─────────────────┼─────────────────────┼─────────────────┼──────────────────────────┤
│  (none)         │ Doctor signs up     │ PENDING         │ Create profile           │
│  PENDING        │ MDCN auto-verified  │ AUTO_MATCHED    │ Set verified_at          │
│  PENDING        │ Admin approves      │ VERIFIED        │ Set verified_at          │
│  PENDING        │ Admin rejects       │ REJECTED        │ Send notification        │
│  REJECTED       │ Doctor resubmits    │ PENDING         │ Clear verified_at        │
│  AUTO_MATCHED   │ -                   │ -               │ Full access granted      │
│  VERIFIED       │ -                   │ -               │ Full access granted      │
└─────────────────┴─────────────────────┴─────────────────┴──────────────────────────┘
```

---

## 5.12 Implementation Challenges and Considerations

### 5.12.1 Security Challenges

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY IMPLEMENTATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. END-TO-END ENCRYPTION                                                   │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  Challenge: Encrypt sensitive medical data while maintaining      │   │
│     │             searchability and database integrity                  │   │
│     │                                                                   │   │
│     │  Solution:  - AES-256-GCM encryption for description + metadata   │   │
│     │             - Title remains unencrypted for search                │   │
│     │             - Encryption key stored in environment variable       │   │
│     │             - Decryption happens client-side only                 │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  2. FILE INTEGRITY                                                          │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  Challenge: Detect tampering of medical documents                 │   │
│     │                                                                   │   │
│     │  Solution:  - SHA-256 hash calculated before upload               │   │
│     │             - Hash stored with record in database                 │   │
│     │             - Can verify hash on download (future enhancement)    │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  3. ACCESS CONTROL                                                          │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  Challenge: Fine-grained access to shared records                 │   │
│     │                                                                   │   │
│     │  Solution:  - Row Level Security (RLS) in PostgreSQL              │   │
│     │             - Share tokens with expiry + PIN                      │   │
│     │             - Record-level access control (share specific IDs)    │   │
│     │             - Audit logging for all access                        │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.12.2 Rate Limiting and Email Constraints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE RATE LIMITS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EMAIL LIMITS (Free Tier):                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  • 2 emails per hour per user                                      │    │
│  │  • Affects: OTP codes, password reset, confirmation emails         │    │
│  │                                                                    │    │
│  │  Mitigation:                                                       │    │
│  │  - Clear error messages when rate limited                          │    │
│  │  - Guide users to wait or use alternative sign-in                  │    │
│  │  - For production: Configure custom SMTP provider                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  OTP LIMITS:                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  • 360 OTPs per hour                                               │    │
│  │  • 60-second window between resend requests                        │    │
│  │                                                                    │    │
│  │  Implementation:                                                   │    │
│  │  - Disable resend button for 60 seconds                            │    │
│  │  - Show countdown timer to user                                    │    │
│  │  - 8-digit OTP codes for security                                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  STORAGE LIMITS:                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  • 1GB storage (free tier)                                         │    │
│  │  • 50MB per file limit configured                                  │    │
│  │                                                                    │    │
│  │  Implementation:                                                   │    │
│  │  - Client-side file size validation                                │    │
│  │  - Compression recommendations for large documents                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.12.3 Offline Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE MODE STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  IMPLEMENTED (Emergency Mode):                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  • Critical data cached in localStorage                            │    │
│  │  • Blood group, genotype, allergies, chronic conditions            │    │
│  │  • Emergency contact information                                   │    │
│  │  • Manual sync trigger by user                                     │    │
│  │  • Works without internet connection                               │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  FUTURE CONSIDERATIONS (Not Implemented):                                   │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  • Full offline sync would require:                                │    │
│  │    - Service Worker for caching                                    │    │
│  │    - IndexedDB for structured data storage                         │    │
│  │    - Conflict resolution for concurrent edits                      │    │
│  │    - Background sync API for queued operations                     │    │
│  │                                                                    │    │
│  │  • Complexity trade-offs:                                          │    │
│  │    - Significant development effort                                │    │
│  │    - Encryption key management offline                             │    │
│  │    - Data consistency challenges                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.12.4 Technology Stack Decisions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY CHOICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend: React 19 + TypeScript + Vite                                     │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Rationale:                                                        │    │
│  │  - Type safety for healthcare data handling                        │    │
│  │  - Modern React features (hooks, concurrent mode)                  │    │
│  │  - Fast development with Vite HMR                                  │    │
│  │  - Strong ecosystem (React Query, React Hook Form)                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Backend: Supabase (PostgreSQL + Auth + Storage)                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Rationale:                                                        │    │
│  │  - Built-in authentication with OTP support                        │    │
│  │  - Row Level Security for fine-grained access                      │    │
│  │  - Real-time subscriptions (future use)                            │    │
│  │  - Managed infrastructure (suitable for resource-limited env)      │    │
│  │  - PostgreSQL for complex queries and JSONB support                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  State Management: Zustand + React Query                                    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Rationale:                                                        │    │
│  │  - Zustand: Lightweight auth state (no Redux boilerplate)          │    │
│  │  - React Query: Server state with caching and refetching           │    │
│  │  - Clear separation of client vs server state                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Encryption: Web Crypto API (AES-256-GCM)                                   │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Rationale:                                                        │    │
│  │  - Native browser API (no external dependencies)                   │    │
│  │  - Industry-standard encryption                                    │    │
│  │  - Authenticated encryption (GCM mode)                             │    │
│  │  - Client-side encryption (data encrypted before sending)          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This chapter documented the technical implementation of PH-DVault through:

1. **Sequence Diagrams** (5.9): Detailed interaction flows for authentication, record creation, and secure sharing between patients and doctors.

2. **Administrative Verification Workflow** (5.10): Process flow for doctor MDCN verification with multiple pathways (auto-matching, manual review).

3. **Verification State Machine** (5.11): Formal state transitions for doctor verification status with clear actions at each transition.

4. **Implementation Challenges** (5.12): Technical considerations including:
   - Security (encryption, file integrity, access control)
   - Rate limiting constraints
   - Offline strategy
   - Technology stack rationale

These diagrams provide a comprehensive view of the system's implementation architecture and the design decisions made to address healthcare data management challenges in resource-limited environments.
