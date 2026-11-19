# Security Specification — CASH CONNECT BÉNIN

## 1. Data Invariants
1. **Identity & Immutability**: An agent's `uid`, `authorId`, `initiatorId`, `reporterId`, and `createdAt` can never be reassigned or forged (`== request.auth.uid` on create, immutable on update).
2. **No Self-Assigned Verification**: A user creating or updating `agents_public/{agentId}` can NEVER set `verificationLevel` to `community` or `certified`. Only an admin (`isAdmin()`) may change `verificationLevel`.
3. **PII Isolation**: Phone numbers (`whatsapp`) and `email` reside strictly inside `/agents_public/{agentId}/private/contact` (owner/admin only) or inside `/conversations/{conversationId}` (explicitly shared by a participant to that specific conversation). Public collections never store phone numbers or emails.
4. **Master Gate on Subcollections**: Every message in `/conversations/{conversationId}/messages/{messageId}` must verify parent conversation membership via `get()` on create, and store the exact `participantIds` pair so `allow list` validates `request.auth.uid in resource.data.participantIds` without calling `get()`.
5. **Terminal State Locking**: Closed listings (`status == 'closed'`), resolved/approved/rejected verification requests, and resolved reports cannot be modified by non-admin users.
6. **Strict Bounds & Anti-Shadow-Fields**: Every document write validates exact key allowlists (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update), strict string length limits, valid numeric bounds (`amount >= 500 && amount <= 25000000`), and server-enforced `request.time` timestamps.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Shadow Field Injection on Agent Profile**: Creating `agents_public/{uid}` with `verificationLevel: "certified"` or an unexpected field `isAdmin: true`.
2. **Identity Spoofing on Listing**: Creating `listings/{id}` with `authorId: "other-uid"` different from `request.auth.uid`.
3. **Unverified Email Write**: Attempting any write when `request.auth.token.email_verified == false`.
4. **PII Scraping (`agents_public/{otherUid}/private/contact`)**: Authenticated non-owner reading another agent's private contact document.
5. **Blanket Unfiltered Listing Query**: Querying `listings` without filtering `status == 'active'` (or `authorId == uid`) to scrape closed/private records.
6. **Value Poisoning on Listing Amount**: Creating or updating a listing with `amount: -5000` or `amount: 9999999999` or `amount: "50000"`.
7. **ID Poisoning**: Writing to `/listings/!invalid$id...` or a 1.5KB document ID.
8. **Post-Terminal Mutation**: Author attempting to update a listing after `status` has reached `'closed'`.
9. **Unauthorized Verification Elevation**: Agent updating their own `verification_requests/{reqId}` status to `'approved'`.
10. **Cross-Tenant Message Injection**: User C (not in `participantIds`) creating a message in `/conversations/{convId}/messages/{msgId}`.
11. **Timestamp Forgery**: Creating a listing with a backdated or future `createdAt` not equal to `request.time`.
12. **Conversation Hijacking**: Updating `participantIds` or `initiatorId` on an existing conversation, or modifying the other participant's `recipientWhatsapp` / `initiatorWhatsapp` field.
