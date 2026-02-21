# AgentSubber Comprehensive Upgrade Plan

**Current State Analysis:** Basic giveaway system with limited requirements (only X follow)
**Target State:** Full-featured Web3 giveaway/allowlist platform with multi-platform verification

---

## Phase 1: Database Schema Updates

### 1.1 Giveaway Enhancements
```prisma
model Giveaway {
  // Existing fields...
  
  // NEW: Start time for scheduled giveaways
  startAt          DateTime       // Currently missing, only has endAt
  
  // NEW: Chain selection
  chain            Chain          @default(SOL)
  
  // NEW: Twitter/X requirements (expand beyond just follow)
  requiresXRetweet Boolean        @default(false)
  xTweetToRetweet  String?        // Tweet ID or URL
  requiresXLike    Boolean        @default(false)
  xTweetToLike     String?        // Tweet ID or URL
  requiresXTag     Boolean        @default(false)
  xTagsRequired    String?        // Comma-separated tags
  
  // NEW: Discord requirements
  requiresDiscordJoin Boolean     @default(false)
  discordGuildId      String?
  requiredDiscordRole String?     // Role ID required to enter
  
  // NEW: Telegram requirements
  requiresTelegram    Boolean     @default(false)
  telegramGroup       String?     // Group/channel invite link or @username
  
  // NEW: Private/Team features
  isPrivate           Boolean     @default(false)
  hideEntryCount      Boolean     @default(false)
  teamSpots           Int?        // Reserved spots for team
  
  // NEW: Offer-specific fields (when giveaway is an offer to another community)
  isOffer             Boolean     @default(false)
  offerToCommunityId  String?
  offerMintInfo       String?     @db.Text
  
  // Relations
  roleMultipliers     RoleMultiplier[]
  taskVerifications   TaskVerification[]
}
```

### 1.2 Role Multipliers (NEW Model)
```prisma
model RoleMultiplier {
  id          String   @id @default(cuid())
  giveawayId  String
  communityId String   // Community that owns the role
  roleId      String   // Discord role ID
  roleName    String   // Human-readable name
  multiplier  Int      @default(1)  // e.g., 5 = 5x entries
  createdAt   DateTime @default(now())
  
  giveaway    Giveaway  @relation(fields: [giveawayId], references: [id], onDelete: Cascade)
  
  @@unique([giveawayId, roleId])
}
```

### 1.3 Community Roles (NEW Model)
```prisma
model CommunityRole {
  id          String    @id @default(cuid())
  communityId String
  name        String    // "VIP", "OG", "Whitelist", etc.
  description String?
  discordRoleId String? // Linked Discord role
  color       String?   // Hex color for UI
  priority    Int       @default(0)  // For sorting
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  
  @@unique([communityId, name])
}
```

### 1.4 Task Verification (NEW Model)
```prisma
model TaskVerification {
  id              String    @id @default(cuid())
  giveawayId      String
  entryId         String
  userId          String
  taskType        String    // "X_FOLLOW", "X_RT", "X_LIKE", "DISCORD_JOIN", "DISCORD_ROLE", "TELEGRAM_JOIN"
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  verificationData Json?    // Store proof/metadata
  createdAt       DateTime  @default(now())
  
  giveaway  Giveaway      @relation(fields: [giveawayId], references: [id], onDelete: Cascade)
  entry     GiveawayEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  @@unique([entryId, taskType])
}
```

### 1.5 Offer System (Enhance CollabOffer)
```prisma
model CollabOffer {
  // Existing fields...
  
  // NEW: Offer details
  projectName     String
  logoDescription String?    @db.Text
  chain           Chain      @default(SOL)
  numSpots        Int
  mintInfo        String?    @db.Text
  startAt         DateTime
  endAt           DateTime
  requirements    Json?      // Store complex requirements
  
  // NEW: Visibility
  isPrivate       Boolean    @default(false)
  hideEntries     Boolean    @default(false)
  teamSpots       Int?
}
```

---

## Phase 2: API Endpoints

### 2.1 Giveaway Management
- `POST /api/giveaways` - Enhanced with all new fields
- `PATCH /api/giveaways/[id]` - **NEW: Edit existing giveaway**
- `POST /api/giveaways/[id]/publish` - **NEW: Publish draft**
- `GET /api/giveaways/[id]/winners` - **NEW: Export winners**
- `POST /api/giveaways/[id]/draw` - Enhanced winner selection with role multipliers

### 2.2 Task Verification
- `POST /api/giveaways/[id]/verify-twitter` - **NEW: Verify Twitter tasks**
- `POST /api/giveaways/[id]/verify-discord` - **NEW: Verify Discord join/role**
- `POST /api/giveaways/[id]/verify-telegram` - **NEW: Verify Telegram join**

### 2.3 Role Management
- `GET /api/communities/[id]/roles` - **NEW: List community roles**
- `POST /api/communities/[id]/roles` - **NEW: Create custom role**
- `PATCH /api/communities/[id]/roles/[roleId]` - **NEW: Edit role**
- `DELETE /api/communities/[id]/roles/[roleId]` - **NEW: Delete role**

### 2.4 Discord Integration
- `POST /api/discord/bot-invite` - **NEW: Generate Discord bot invite link**
- `GET /api/discord/guilds` - **NEW: List connected Discord servers**
- `POST /api/discord/sync-roles` - **NEW: Sync Discord roles to community**

### 2.5 Offer System
- `POST /api/offers` - **NEW: Create offer to another community**
- `GET /api/offers/incoming` - **NEW: List offers received**
- `GET /api/offers/outgoing` - **NEW: List offers sent**
- `POST /api/offers/[id]/accept` - **NEW: Accept offer**
- `POST /api/offers/[id]/decline` - **NEW: Decline offer**

### 2.6 Collab Requests
- `POST /api/collabs/request` - **NEW: Community sends collab request to project**
- `GET /api/collabs/requests` - **NEW: List collab requests**
- `PATCH /api/collabs/[id]` - **NEW: Accept/decline collab**

---

## Phase 3: UI Components

### 3.1 Enhanced Giveaway Creation Form
**Location:** `app/dashboard/giveaways/new/page.tsx`

**NEW Fields:**
- Start time (datetime picker)
- Chain selection (SOL, BTC, ETH dropdown)
- Draft/Publish toggle
- Private giveaway checkbox
- Hide entry count checkbox
- Team spots (number input)

**NEW Sections:**
- **Twitter Requirements:**
  - ✅ Require Follow (existing, enhance)
  - ✅ Require Retweet (NEW)
  - ✅ Require Like (NEW)
  - ✅ Require Tag (NEW)

- **Discord Requirements:**
  - ✅ Require Join Server (NEW)
  - ✅ Require Specific Role (NEW)
  - ✅ Role Multipliers (NEW - table)

- **Telegram Requirements:**
  - ✅ Require Join Group/Channel (NEW)

### 3.2 Giveaway Edit Page (NEW)
**Location:** `app/dashboard/giveaways/[id]/edit/page.tsx`

- Load existing giveaway data
- Same form as creation
- "Save Changes" instead of "Create"
- Warning when editing active giveaway

### 3.3 Role Multiplier Manager (NEW Component)
**Location:** `components/giveaway/RoleMultiplierManager.tsx`

- Table of roles with multiplier inputs
- Add role button (Discord role selector)
- Remove role button
- Multiplier preview (e.g., "VIP role: 5x entries")

### 3.4 Discord Bot Setup Wizard (NEW)
**Location:** `app/dashboard/discord/setup/page.tsx`

- Step 1: Invite bot to server
- Step 2: Select server from dropdown
- Step 3: Grant permissions
- Step 4: Sync roles
- Status indicator (connected/disconnected)

### 3.5 Winners Export Modal (NEW Component)
**Location:** `components/giveaway/WinnersExportModal.tsx`

- Copy to clipboard button
- Export as CSV button
- Export as Google Sheets (integration)
- Winner list display with wallet addresses

### 3.6 Offer Creation Form (NEW)
**Location:** `app/dashboard/offers/new/page.tsx`

**Fields:**
- Target community (search/select)
- Project name
- Logo/image upload
- Chain selection
- Number of spots
- Mint info (rich text)
- Start/end time
- Requirements (checkboxes)
- Private offer checkbox
- Hide entries checkbox
- Team spots

### 3.7 Collab Request Manager (NEW)
**Location:** `app/dashboard/collabs/page.tsx`

- **Tabs:**
  - Incoming requests
  - Outgoing requests
  - Active collabs

- **Actions:**
  - Send new request
  - Accept/decline
  - View details

---

## Phase 4: Twitter/X Verification System

### 4.1 Backend Verification
**Challenge:** Twitter API limitations for bot verification

**Solutions:**
1. **Twitter API v2 Integration**
   - Check if user follows account
   - Check if user retweeted specific tweet
   - Check if user liked specific tweet
   - Rate limits: 15 requests per 15 minutes

2. **Fallback: Manual Verification**
   - User submits Twitter username
   - Admin reviews entries manually
   - Mark as verified/rejected

3. **Hybrid: Screenshot Proof**
   - User uploads screenshot of completed task
   - AI vision API validates screenshot
   - Admin review queue for edge cases

### 4.2 Implementation Priority
**Phase 4A (Immediate):**
- Manual verification queue
- Admin panel to review entries

**Phase 4B (Next):**
- Twitter API integration (requires Twitter Developer account)
- Automated verification where possible

**Phase 4C (Future):**
- AI screenshot validation
- Blockchain-verified Twitter accounts (Solana Blinks integration)

---

## Phase 5: Discord Integration

### 5.1 Discord Bot
**Requirements:**
- Bot must be invited to community Discord
- Bot needs "Read Members" permission
- Bot needs role access

**Features:**
1. Verify user has joined server
2. Verify user has specific role
3. Sync roles to platform database
4. Auto-assign role multipliers

### 5.2 Discord OAuth Flow
- User connects Discord account
- Platform stores Discord ID
- Can verify tasks against Discord ID

---

## Phase 6: Telegram Integration

### 6.1 Telegram Bot
**Features:**
1. Verify user joined channel/group
2. Store Telegram user ID
3. Link Telegram to platform account

### 6.2 Verification Flow
- User clicks "Join Telegram" button
- Redirects to Telegram channel
- Bot verifies membership
- Platform marks task as complete

---

## Implementation Order (Priority)

### Week 1: Core Enhancements
1. ✅ Update Prisma schema (all new models)
2. ✅ Migrate database
3. ✅ Enhance giveaway creation form (start time, chain, draft mode)
4. ✅ Add RT, Like, Telegram requirements to UI
5. ✅ Build role multiplier component

### Week 2: Verification Systems
6. ✅ Twitter manual verification queue
7. ✅ Discord OAuth integration
8. ✅ Discord role sync
9. ✅ Telegram verification basic flow

### Week 3: Management Features
10. ✅ Giveaway edit page
11. ✅ Winners export functionality
12. ✅ Discord bot setup wizard
13. ✅ Role management UI

### Week 4: Offers & Collabs
14. ✅ Offer creation system
15. ✅ Collab request system
16. ✅ Private giveaways
17. ✅ Team spots allocation

### Week 5: Advanced Features
18. ✅ Twitter API integration (automated verification)
19. ✅ Role multiplier winner drawing algorithm
20. ✅ Analytics dashboard (entry stats, verification rates)
21. ✅ Email notifications for offers/collabs

---

## Technical Dependencies

**NPM Packages Needed:**
- `discord.js` - Discord bot integration
- `node-telegram-bot-api` - Telegram bot
- `twitter-api-v2` - Twitter verification (requires developer account)
- `csv-stringify` - CSV export
- `google-spreadsheet` - Google Sheets integration (optional)

**APIs Required:**
- Twitter Developer Account (for automated verification)
- Discord Bot Token
- Telegram Bot Token

**Environment Variables:**
```env
# Discord
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=

# Telegram
TELEGRAM_BOT_TOKEN=

# Twitter (Optional - for automated verification)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
```

---

## Database Migration Commands

```bash
# Add new fields to existing models
prisma migrate dev --name add-giveaway-enhancements

# Add new models (RoleMultiplier, CommunityRole, TaskVerification)
prisma migrate dev --name add-role-multipliers

# Enhance CollabOffer
prisma migrate dev --name enhance-collab-offers

# Generate Prisma client
prisma generate
```

---

## Testing Checklist

- [ ] Create giveaway with all requirement types
- [ ] Edit existing giveaway
- [ ] Publish draft giveaway
- [ ] Enter giveaway and verify tasks
- [ ] Discord role multiplier (test 5x entries)
- [ ] Draw winners with role multipliers
- [ ] Export winners to CSV
- [ ] Send offer to community
- [ ] Accept/decline offer
- [ ] Send collab request
- [ ] Private giveaway (hidden from public)
- [ ] Team spots allocation

---

## Current Status

**Completed:**
- ❌ None (starting fresh)

**In Progress:**
- Schema design (this document)

**Next Steps:**
1. Review and approve this plan
2. Start with database schema updates
3. Build enhanced giveaway form
4. Implement verification systems
