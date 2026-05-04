# Security Specification - OpsRelic Agency Dashboard

## 1. Data Invariants
- A **User** document must match the authenticated User ID and only store allowed plan tiers.
- A **Workspace** document must belong to the authenticated User ID who is modifying it.
- **Campaigns** and **Submissions** must always contain a `userId` field that matches the creator's authenticated ID.
- Users cannot modify their own `plan` to upgrade themselves without external verification (though for this demo, we'll allow initial creation/read).

## 2. The Dirty Dozen (Attacker Payloads)

1. **Identity Spoofing (Workspace)**: Authenticated user A attempts to update `workspaces/userB`.
2. **Identity Spoofing (Submission)**: Authenticated user A attempts to create a submission with `userId: userB`.
3. **Privilege Escalation**: User attempts to update `users/userA` and set `plan: 'agency'` from a free account.
4. **ID Poisoning**: Attempt to create a campaign with a 2MB string as the document ID.
5. **Shadow Field Injection**: Attempt to add `isAdmin: true` to a Workspace document.
6. **Type Poisoning**: Attempt to set `views` to "one million" (string) instead of a number.
7. **Orphaned Record**: Attempt to create a submission for a `campaignId` that doesn't exist.
8. **PII Leakage**: Authenticated user B attempts to 'get' `users/userA`.
9. **Bulk Scrape**: Authenticated user attempts a list query on `submissions` without filtering for their own `userId`.
10. **Immutable Field Mutation**: User attempts to change `userId` on an existing campaign.
11. **Resource Exhaustion**: Attempt to set a campaign `name` to a 10MB string.
12. **Status Shortcut**: Non-admin user attempts to set submission `status` directly to 'paid' (if restricted).

## 3. Test Runner - `firestore.rules.test.ts` (Conceptual)
The generated rules will ensure:
- `request.auth.uid == userId` for all document-level access on `users` and `workspaces`.
- `incoming().userId == request.auth.uid` for all creations in `campaigns` and `submissions`.
- `isValidWorkspace()` enforces strict schema for branding.
- `allow list` requires `resource.data.userId == request.auth.uid`.
