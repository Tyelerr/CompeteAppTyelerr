# Messages System Implementation TODO

## Database Layer

- [ ] Create support_messages table SQL script
- [ ] Add ISupportMessage interface to InterfacesGlobal.tsx

## API Layer

- [ ] Create CrudMessages.tsx with CRUD operations

## Frontend Layer

- [ ] Update ScreenFAQsContact.tsx to save messages to database
- [ ] Update ScreenAdminMessages.tsx with full message management
- [ ] Create message display components

## Features to Include:

- Message type (from dropdown: Tournament Inquiry, Technical Support, Account Issue, Feedback/Suggestion)
- Message body/content
- User information (from authenticated user)
- Tournament ID (optional, for Tournament Inquiry type)
- Status tracking (unread/read, pending/resolved)
- Timestamps (created_at, updated_at)
- Admin response capability

## Progress:

- [ ] Step 1: Create database table
- [ ] Step 2: Add interfaces
- [ ] Step 3: Create CRUD operations
- [ ] Step 4: Update FAQ contact form
- [ ] Step 5: Update admin messages screen
- [ ] Step 6: Test functionality
