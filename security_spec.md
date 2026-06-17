# Security Specification for Maqam Engine

## Data Invariants
1. A project must have an `ownerId` matching the creator's UID.
2. A project cannot be read or modified by anyone other than the `ownerId`.
3. State Vault documents must be nested under the user's UID and the `userId` in the document must match.
4. Timestamps should be consistent with server time where applicable.

## The Dirty Dozen Payloads

1. **Identity Theft (Project)**: Create a project with someone else's UID as `ownerId`.
2. **Project Hijack**: Update another user's project `ownerId` to my UID.
3. **Ghost Project**: Create a project without an `ownerId`.
4. **State Vault Trespass**: Write a state document to another user's `{userId}` path.
5. **State UID Spoof**: Write a state document to my own path but with a different `userId` in the payload.
6. **Malicious ID**: Use an extremely long or invalid character string as `projectId`.
7. **Phantom Update**: Update a project's `createdAt` timestamp post-creation.
8. **Size Attack**: Inject a massive string into a project title.
9. **Illegal Sync Status**: Set `syncStatus` to an invalid value like "hacking".
10. **Record Poisoning**: Set `payloadSize` to a negative number or a massive number inconsistent with actual payload.
11. **Path Variable ID Poisoning**: Attempt to use `../` or other injection strings in document IDs.
12. **Unauthenticated Write**: Attempt to create a project without being logged in.

## Test Runner Plan
I will generate `firestore.rules.test.ts` to verify these rules (conceptual, using the guidelines' logic).
