# Security Requirements
1. Users can only access their own data.
2. `userId` field cannot be modified after creation.
3. `createdAt` is immutable.
4. Validation schemas strict checking.

## The Dirty Dozen test payloads:
1. Creating a campaign with missing field.
2. Creating a campaign with extra field.
3. Overwriting `userId` on a campaign during update.
4. Reading another user's campaign.
5. Deleting another user's campaign.
6. Updating a string to an array instead.
7. Submitting a new submission for a non-existent campaign.
8. Submitting a tracking link with invalid characters for ID.
9. Modifying `createdAt` during update.
10. Querying submissions blindly (without `userId == request.auth.uid`).
11. Querying campaigns as an unauthenticated user.
12. Creating a submission without an updatedAt timestamp.
