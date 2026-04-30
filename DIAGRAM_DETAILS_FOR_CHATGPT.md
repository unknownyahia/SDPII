# Diagram Details for ChatGPT

This document provides implementation-based technical details for generating the missing diagrams in the Spots Mobile senior project report. It is based on the active React Native CLI application under `mobile/`, the Firebase backend files, Firestore rules, README/run guides, Git history, and the fixed report file `SDP_final_full_app_updated_FIXED.docx`.

The legacy Expo implementation is archived as a proof-of-concept and should not be shown as the active architecture.

Main sources inspected:
- `SDP_final_full_app_updated_FIXED.docx`
- `SDP_final_full_app_updated_FIXED.md`
- `README.md`
- `package.json`
- `firebase.json`
- `firestore.rules`
- `functions/index.js`
- `tests/README.md`
- `tests/backend-trust.test.cjs`
- `mobile/package.json`
- `mobile/REAL_DEVICE_RUN.md`
- `mobile/App.tsx`
- `mobile/src/navigation/*`
- `mobile/src/context/*`
- `mobile/src/firebase/*`
- `mobile/src/screens/**/*`
- `mobile/src/components/**/*`
- `mobile/src/services/**/*`
- `mobile/src/repositories/**/*`
- `mobile/src/types/**/*`

==================================================
## 1. DIAGRAM INVENTORY
==================================================

The following diagrams and screenshots are required because the fixed report contains matching placeholders.

| Figure Number | Diagram Title | Diagram Type | Purpose | Report Section | Information Available | Missing Information |
| --- | --- | --- | --- | --- | --- | --- |
| Figure 1 | Use Case Diagram | UML use case diagram | Show actors and major system use cases UC01-UC18. | Requirements Analysis | Available from report Table 5, Appendix A, screens, services, Firestore rules, and Cloud Functions. | None for functional scope. Diagram still needs to be drawn. |
| Figure 2 | Project Gantt Chart | Gantt chart | Show project tasks across Semester 1 and Semester 2. | Project Plan | Partially available from report milestones and Git history. | Exact planned dates, assigned team members, and true dependency dates are not fully available. Team input required. |
| Figure 3 | High-Level System Architecture Diagram | Layered architecture / deployment diagram | Show React Native app, service/repository layers, Firebase backend, Cloud Functions, OpenAI, maps/geolocation, and security boundary. | System Architecture | Available from `mobile/App.tsx`, navigation, services, repositories, `firebase.ts`, `functions/index.js`, and `firestore.rules`. | Production deployment endpoints and final hosting details should be confirmed by team. |
| Figure 4 | Structural/Class Model | UML class/entity diagram | Show key domain entities and relationships. | Detailed Design | Available from `mobile/src/types/*`, repositories, Firestore rules, and Cloud Functions. | Some server-generated timestamp concrete runtime types remain `unknown` in TypeScript. |
| Figure 5 | Service and Repository Diagram | Component/module diagram | Show service modules, repository modules, screens, and backend dependencies. | Detailed Design | Available from `mobile/src/services/*`, `mobile/src/repositories/*`, and screen imports. | None for MVP-level diagram. |
| Figure 6 | Register/Login Flow | UML sequence diagram or flowchart | Show authentication, profile creation, subscription setup, AuthContext, and navigation. | Detailed Design | Available from auth screens, `authService`, `authRepository`, `profileService`, `subscriptionService`, `AuthContext`, and navigation. | None for implemented flow. |
| Figure 7 | Post Activity Update Flow | UML sequence diagram or flowchart | Show post creation with validation, location, Firestore write, XP trigger, and feed update. | Detailed Design | Available from `PostScreen`, `postService`, `postsRepository`, `locationService`, `functions/index.js`, and Firestore rules. | Real screenshot/evidence still needed for report. |
| Figure 8 | Explore and AI Summary Flow | UML sequence diagram or flowchart | Show Explore map/list loading, filters, summary request, Cloud Function, OpenAI, and response. | Detailed Design | Available from `ExploreScreen`, `ExploreScreen.web`, `ExploreMapSurface.web`, `summaryService`, `functions/index.js`, and repositories. | OpenAI production configuration evidence not available. |
| Figure 9 | Promoted Event Flow | UML sequence diagram or flowchart | Show organization event creation, role/plan/quota checks, callable function, and Firestore write. | Detailed Design | Available from `PostScreen`, `eventService`, `subscriptionService`, `eventRepository`, `functions/index.js`, and Firestore rules. | Payment gateway is future work and should be dashed/optional. |
| Figure 10 | Report and Moderation Flow | UML sequence diagram or flowchart | Show report creation, admin review, hiding post/comment, and security restrictions. | Detailed Design | Available from `PostInteractionPanel`, `reportService`, `moderationService`, repositories, `AdminConsolePanel`, and Firestore rules. | Current UI reports posts. Comment report support exists in types/rules/services but no clear comment report UI was found. |
| Figure 11 | XP, Notification, and Leaderboard Flow | UML sequence diagram or flowchart | Show backend-triggered XP, notifications, and leaderboard callable. | Detailed Design | Available from Cloud Functions, notification/gamification/leaderboard services, repositories, and profile components. | Production push notifications are future work. In-app notifications are implemented. |
| Figure 12 | Login/Register UI Screenshot | UI screenshot | Show authentication UI state. | Detailed Design, UI Design | Available from `LoginScreen.tsx` and `RegisterScreen.tsx`. | Real screenshot must be captured from running app. |
| Figure 13 | Home Screen UI Screenshot | UI screenshot | Show feed/discovery homepage. | Detailed Design, UI Design | Available from `HomeScreen.tsx` and `HomeScreen.web.tsx`. | Real screenshot must be captured from running app with sample data. |
| Figure 14 | Explore Map UI Screenshot | UI screenshot | Show map/list, markers, filters, summary/detail panel. | Detailed Design, UI Design | Available from native and web Explore screens. | Real screenshot must be captured. Android Google Maps key may be required for native map. |
| Figure 15 | Post Screen UI Screenshot | UI screenshot | Show post/event creation form. | Detailed Design, UI Design | Available from `PostScreen.tsx` and `PostScreen.web.tsx`. | Real screenshot must be captured. |
| Figure 16 | Profile Screen UI Screenshot | UI screenshot | Show profile, settings, saved spots, notifications, leaderboard. | Detailed Design, UI Design | Available from `ProfileScreen.tsx` and `ProfileScreen.web.tsx`. | Real screenshot must be captured. |
| Figure 17 | Admin Console UI Screenshot | UI screenshot | Show admin analytics, user plan controls, and report moderation. | Detailed Design, UI Design | Available from `AdminConsolePanel.tsx`. | Requires admin account/sample reports. Real screenshot must be captured. |

==================================================
## 2. USE CASE DIAGRAM DETAILS
==================================================

Sources used:
- `SDP_final_full_app_updated_FIXED.docx`
- `SDP_final_full_app_updated_FIXED.md`
- `mobile/src/screens/auth/LoginScreen.tsx`
- `mobile/src/screens/auth/RegisterScreen.tsx`
- `mobile/src/screens/main/HomeScreen.tsx`
- `mobile/src/screens/main/ExploreScreen.tsx`
- `mobile/src/screens/main/PostScreen.tsx`
- `mobile/src/screens/main/ProfileScreen.tsx`
- `mobile/src/components/explore/PostInteractionPanel.tsx`
- `mobile/src/components/profile/AdminConsolePanel.tsx`
- `mobile/src/components/profile/LeaderboardPanel.tsx`
- `mobile/src/services/*`
- `mobile/src/repositories/*`
- `functions/index.js`
- `firestore.rules`

Actors:
- Guest: unauthenticated visitor who can register or log in.
- Authenticated User: signed-in standard user.
- Organization User: signed-in user with `organization` role.
- Admin: signed-in user with `admin` role.
- Firebase Backend: Firebase Auth, Cloud Firestore, and Cloud Functions.
- OpenAI API: external AI service used by the backend-only area summary function.
- Map/Geolocation Provider: device geolocation, browser geolocation, Google Maps on native Android/iOS, and Leaflet/CARTO tiles on web.

| Use Case ID | Use Case Name | Primary Actor | Secondary Actors / Systems | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UC01 | Register Account | Guest | Firebase Auth, Cloud Firestore | Implemented | User creates account using full name, email, password, confirmation, and terms checkbox. System creates Auth account, default profile, and default subscription. |
| UC02 | Login/Logout | Guest / Authenticated User | Firebase Auth, AuthContext, Cloud Firestore | Implemented | Login uses Firebase email/password auth. Logout signs out current user. AuthContext updates navigation state. |
| UC03 | Post Activity Update | Authenticated User | Map/Geolocation Provider, Cloud Firestore, Firebase Backend | Implemented | User creates local update with text, category, optional image URL, and location. Firestore trigger awards XP. |
| UC04 | AI Area Summarization | Authenticated User | Firebase Cloud Functions, OpenAI API | Implemented | Client calls `summarizeArea`; backend validates posts and calls OpenAI. Requires deployed/emulated function and OpenAI key. |
| UC05 | View Map Feed | Authenticated User | Firestore, Map/Geolocation Provider | Implemented | Explore screen subscribes to posts/events and displays map markers, heat layer, cards, and filters. |
| UC06 | Discover Activities | Authenticated User | Firestore | Implemented | Home and Explore use discovery ranking/filtering for posts, events, trending nearby items, and saved updates. |
| UC07 | View Summarized Feed | Authenticated User | Firestore, Cloud Functions, OpenAI API | Partially implemented | Implemented as Explore area summary panel rather than a separate full summarized feed screen. |
| UC08 | Comment and Interact | Authenticated User | Firestore, Firebase Backend | Implemented | User can add comments, like posts, and view counts. Triggers notifications/XP for eligible actions. |
| UC09 | Report Inappropriate Content | Authenticated User | Cloud Firestore, Admin | Implemented | UI supports post reporting. Types/rules/services also support comment target type, but a visible comment report UI was not found. |
| UC10 | Admin Moderate Content | Admin | Cloud Firestore | Implemented for MVP | Admin can review/dismiss/action reports and hide reported posts/comments. |
| UC11 | Manage Profile and Settings | Authenticated User | Cloud Firestore, Localization Context | Implemented | User edits username, bio, language, privacy mode, and notification/email preferences. |
| UC12 | Leaderboard and Points | Authenticated User | Cloud Functions, Cloud Firestore | Implemented | Backend XP events update profile XP. `getLeaderboard` callable returns ranked users with privacy handling. |
| UC13 | Event Promotion | Organization User | Cloud Functions, Cloud Firestore | Implemented for MVP | Organization user creates promoted event through callable function with role, plan, and active quota validation. |
| UC14 | Subscription Management | Admin / Organization User | Cloud Firestore | Partially implemented | Plan/status records and admin updates exist. Payment gateway and self-service billing are future work. |
| UC15 | View Analytics Dashboard | Admin | Cloud Firestore | Implemented for MVP | Admin analytics panel counts users, posts, events, reports, comments, likes, notifications, and organizations. |
| UC16 | Notification System | Authenticated User | Cloud Functions, Cloud Firestore | Partially implemented | In-app notifications for comments/likes are implemented. Production push notifications are future work. |
| UC17 | Manage Favorite Spots | Authenticated User | Cloud Firestore | Implemented | User can save/unsave favorite posts. Favorites appear in Home/Profile and influence saved updates. |
| UC18 | View Heatmap | Authenticated User | Map/Geolocation Provider, Firestore | Implemented for MVP | Explore map includes heatmap/heat layer based on visible posts/events. |

Include and extend relationship suggestions:
- UC01 includes: Firebase account creation, profile initialization, subscription initialization.
- UC02 includes: Firebase session restoration and navigation state update.
- UC03 includes: location selection/current location lookup and Firestore post creation. UC03 extends UC12 because post creation triggers XP.
- UC04 includes: visible post selection, backend validation, OpenAI summarization, summary display.
- UC05 includes: subscribe to posts/events, display markers, filter/search map items.
- UC06 includes: ranking/filtering discovery items from posts/events.
- UC08 includes: add comment and toggle like. UC08 extends UC12 and UC16 because comments/likes can trigger XP and notifications.
- UC09 includes: selecting a reason and creating report record.
- UC10 includes: reviewing report status and optionally hiding reported content.
- UC13 includes: checking organization role, subscription status, plan limit, event validation, and backend event creation.
- UC14 currently includes admin plan/status update. Payment processing should be shown as future/dashed.
- UC16 includes backend-generated in-app notification and client mark-as-read.
- UC18 includes reading visible location-based data and rendering heat layer.

External system interactions:
- Firebase Auth is used by UC01 and UC02.
- Firestore is used by UC01-UC18 except where the use case is purely navigation-level.
- Cloud Functions are used by UC04, UC12, UC13, and UC16.
- OpenAI API is used only through the backend function for UC04.
- Map/geolocation providers are used by UC03, UC05, UC06, UC13, and UC18.

==================================================
## 3. GANTT CHART / PROJECT TIMELINE DETAILS
==================================================

Sources used:
- `SDP_final_full_app_updated_FIXED.docx`
- `SDP_final_full_app_updated_FIXED.md`
- `README.md`
- Git history from local repository

Important limitation:
- Exact planned dates, actual start/end dates for each task, and assigned team members were not found in the available files.
- Use the phrase `Exact date not found. Suggested date needed from team.` for any timeline field that cannot be confirmed.
- Git history provides evidence of repository activity only; it should not be treated as the full project schedule.

Git evidence available:

| Commit | Date | Message | Evidence Use |
| --- | --- | --- | --- |
| `2ed7a624` | 2026-04-10 | Initial commit | Repository initialization evidence only. |
| `d0eba01c` | 2026-04-10 | SDPII published | Active app, Firebase functions, rules, tests, mobile source files. |
| `bc2694f0` | 2026-04-14 | Create web App | Web support, real-device guide, web Firebase config, web screens. |
| `2778a20f` | 2026-04-22 | update the UI | UI refresh, localization, discovery components, profile/post updates. |
| `cd68aa37` | 2026-04-27 | new updates | Events, summaries, leaderboard, admin console, tests, functions/rules updates. |

Milestones:

| Milestone ID | Milestone | Semester | Status | Notes |
| --- | --- | --- | --- | --- |
| M1 | Requirements and problem analysis | Semester 1 | Completed | Described in report. Exact date not found. Suggested date needed from team. |
| M2 | Legacy proof-of-concept | Semester 1 | Completed / Archived | Old Expo version validated concept only. It should be marked as legacy. Exact date not found. |
| M3 | Active app migration | Semester 2 | Completed | React Native CLI app under `mobile/`. Git evidence begins 2026-04-10. |
| M4 | Core discovery features | Semester 2 | Completed | Home, Explore, Post, Profile, map/list discovery, favorites. |
| M5 | Backend functions and security | Semester 2 | Completed | Cloud Functions, Firestore rules, backend trust tests. |
| M6 | Engagement and moderation | Semester 2 | Completed for MVP | Comments, likes, reports, moderation, XP, notifications, leaderboard. |
| M7 | Organization features | Semester 2 | Completed for MVP | Organization role, subscriptions, promoted event limits, admin plan update. |
| M8 | Final verification and report | Semester 2 | Completed | Typecheck, lint, backend trust tests, fixed report. |

Recommended Gantt task table:

| Task ID | Task Name | Start Date | End Date | Duration | Assigned To | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Requirements analysis and problem definition | Exact date not found. Suggested date needed from team. | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | None | Completed |
| T2 | Market research and related work | Exact date not found. Suggested date needed from team. | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | T1 | Completed |
| T3 | Legacy proof-of-concept validation | Exact date not found. Suggested date needed from team. | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | T1, T2 | Completed / Archived |
| T4 | React Native CLI app setup | 2026-04-10 evidence from Git | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | T3 | Completed |
| T5 | Firebase Auth and profile setup | 2026-04-10 evidence from Git | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | T4 | Completed |
| T6 | Home, Explore, Post, and Profile implementation | 2026-04-10 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T4, T5 | Completed |
| T7 | Firestore repositories and services | 2026-04-10 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T5 | Completed |
| T8 | Cloud Functions and AI summaries | 2026-04-10 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T7 | Completed |
| T9 | Reports, moderation, XP, and notifications | 2026-04-10 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T7, T8 | Completed for MVP |
| T10 | Organization events and subscriptions | 2026-04-27 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T5, T7, T8 | Completed for MVP |
| T11 | Testing and verification | 2026-04-10 evidence from Git | 2026-04-27 evidence from Git | Exact duration not found. | Team input required | T6-T10 | Completed for report-level verification |
| T12 | Final documentation and report polish | Exact date not found. Suggested date needed from team. | Exact date not found. Suggested date needed from team. | Exact duration not found. | Team input required | T11 | Completed for supervisor review draft |

Semester grouping:
- Semester 1: T1, T2, T3.
- Semester 2: T4, T5, T6, T7, T8, T9, T10, T11, T12.

==================================================
## 4. HIGH-LEVEL ARCHITECTURE DIAGRAM DETAILS
==================================================

Sources used:
- `mobile/App.tsx`
- `mobile/src/navigation/*`
- `mobile/src/context/AuthContext.tsx`
- `mobile/src/context/LocalizationContext.tsx`
- `mobile/src/firebase/firebase.ts`
- `mobile/src/firebase/firebase.web.ts`
- `mobile/src/screens/**/*`
- `mobile/src/services/**/*`
- `mobile/src/repositories/**/*`
- `functions/index.js`
- `firestore.rules`
- `README.md`
- `mobile/REAL_DEVICE_RUN.md`

| Layer | Component | Responsibility | Communicates With | Notes |
| --- | --- | --- | --- | --- |
| Presentation Layer | `App.tsx` | App root; wraps gesture handling, safe area, auth provider, localization provider, navigation, and toast viewport. | `AuthProvider`, `LocalizationProvider`, `NavigationContainer`, `AppNavigator` | Active React Native CLI entry point. |
| Presentation Layer | Auth screens | Login/register UI and client validation. | `authService`, navigation, toast/alert helpers | Files: `LoginScreen.tsx`, `RegisterScreen.tsx`. |
| Presentation Layer | Main tabs | Home, Explore, Post, Profile navigation. | Screen components and contexts | Files: `MainTabs.tsx`, `MainTabs.web.tsx`. |
| Presentation Layer | Home screen | Discovery landing feed, trending posts, events, saved updates, notifications summary. | Post/event/favorite/notification/comment/reaction services | Native and web versions exist. |
| Presentation Layer | Explore screen | Map/list discovery, markers, filters, favorites, comments/likes/reports, AI summary panel. | Explore/discovery/summary/favorite/comment/reaction/report services; map/geolocation provider | Native uses `react-native-maps`; web uses Leaflet. |
| Presentation Layer | Post screen | Creates posts and promoted events. | `postService`, `eventService`, `subscriptionService`, `locationService` | Media upload is not fully implemented; URL/sample image behavior exists. |
| Presentation Layer | Profile screen | Profile editing, settings, saved spots, notifications, leaderboard, admin console. | Profile/subscription/notification/favorite/leaderboard/admin services | Admin panel shown only for admin role. |
| Presentation Layer | Localization context | English/Arabic labels, direction helpers, translated strings. | Screens and components | Files: `LocalizationContext.tsx`, `i18n/index.ts`. |
| Application/Service Layer | Auth service | Auth workflows, errors, session restoration, profile/subscription initialization. | Auth repository, profile service, subscription service | File: `mobile/src/services/authService.ts`. |
| Application/Service Layer | Profile/subscription services | Default profile/subscription, profile save, plan access checks. | Profile/subscription repositories | Role and plan logic used by event posting/admin. |
| Application/Service Layer | Post/event services | Validate inputs, location, event access state, callable function calls. | Location service, posts repository, callable functions | Event creation uses backend callable for trust. |
| Application/Service Layer | Explore/discovery services | Filter, rank, format, and summarize visible posts/events. | Posts/events data, summary callable | Client handles filtering/ranking; backend handles AI summary. |
| Application/Service Layer | Interaction services | Comments, reactions, favorites, reports. | Firestore repositories | Backend triggers handle XP and notifications. |
| Application/Service Layer | Moderation/admin services | Admin report review, hiding content, analytics, organization role updates. | Repositories and Firestore | Firestore rules restrict admin operations. |
| Repository/Data Access Layer | Auth repository | Firebase Auth wrapper. | Firebase Auth SDK | `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`. |
| Repository/Data Access Layer | Firestore repositories | CRUD/subscription wrappers for users, posts, events, comments, reactions, reports, notifications, analytics. | Cloud Firestore SDK | Enforces local mapping; security rules enforce trust. |
| Backend Layer | Firebase Auth | Identity provider. | Mobile/web client, Firestore rules, Cloud Functions auth context | Required for most app features. |
| Backend Layer | Cloud Firestore | Main data store. | Repositories, Cloud Functions, security rules | Collections include `users`, `posts`, `events`, `reports`. |
| Backend Layer | Firestore Security Rules | Backend authorization boundary. | All Firestore reads/writes | Rules deny direct event writes, XP writes, notification creates, role escalation. |
| Backend Layer | Cloud Functions | Backend-only business logic for XP, notifications, promoted event creation, AI summaries, leaderboard. | Firestore, OpenAI API, callable clients | File: `functions/index.js`. |
| External Services | OpenAI API | Area summarization text generation. | `summarizeArea` Cloud Function | API key stays backend-side. |
| External Services | Map/geolocation providers | Device/browser location and map rendering. | Explore/Post screens, location service | Native maps need Google Maps API key for Android. |
| Future/Optional Services | Payment gateway | Paid subscription checkout and billing. | Future subscription module, backend webhooks | Not implemented. Show as dashed optional. |
| Future/Optional Services | Production push notifications | Device push delivery. | Future Cloud Messaging/APNs/FCM integration | Current notifications are in-app Firestore notifications only. |
| Future/Optional Services | Full media upload | Image/video upload and storage. | Future Firebase Storage or equivalent | Current post media persistence is limited to existing HTTP(S) URLs/sample images. |

Security/trust boundaries:
- The client is untrusted for role changes, plan changes, XP, notifications, promoted event quotas, and OpenAI API usage.
- Firestore rules deny direct client writes to `events`, `users/{userId}/xpEvents`, and notification creation.
- Cloud Functions are trusted backend operations for:
  - awarding XP,
  - creating/upserting notifications,
  - validating and creating promoted events,
  - calling OpenAI,
  - aggregating leaderboard entries.
- Admin operations are restricted by `users/{uid}.role == 'admin'` in Firestore rules and service-level checks.
- Organization-only event creation is enforced on both client and backend. Backend validation is authoritative.

Client-side operations:
- UI rendering and navigation.
- Input validation before service calls.
- Firestore subscriptions for feed/map/profile/notifications.
- Filtering, sorting, and discovery ranking.
- Map rendering and location permission requests.
- In-app notification read updates by recipient.

Backend-only operations:
- XP event writes and profile XP increments.
- Notification creation for comments/likes.
- Promoted event creation and quota enforcement.
- AI summary generation through OpenAI.
- Leaderboard aggregation.

Architecture flow examples:
- Register: `Guest -> Register Screen -> authService -> authRepository -> Firebase Auth -> profileService/subscriptionService -> Firestore -> AuthContext -> Main Tabs`
- Login: `Guest -> Login Screen -> authService -> authRepository -> Firebase Auth -> ensure profile/subscription -> AuthContext -> Main Tabs`
- Post: `User -> Post Screen -> postService -> locationService/postsRepository -> Firestore posts -> onPostCreated Cloud Function -> users/{uid}/xpEvents + users/{uid}.xp -> subscribed UI update`
- Explore summary: `User -> Explore Screen -> summaryService -> summarizeArea Cloud Function -> OpenAI API -> Cloud Function response -> Summary card UI`
- Promoted event: `Organization User -> Post Screen Event Form -> eventService -> createPromotedEvent Cloud Function -> Firestore users/subscription/events -> Event list/map update`
- Moderation: `User -> PostInteractionPanel -> reportService -> reports collection -> AdminConsolePanel -> moderationService -> Firestore report/post/comment update`
- Leaderboard: `User -> LeaderboardPanel -> leaderboardService -> getLeaderboard Cloud Function -> Firestore users query -> ranked response -> Profile UI`

==================================================
## 5. STRUCTURAL / CLASS MODEL DETAILS
==================================================

Sources used:
- `mobile/src/types/profile.ts`
- `mobile/src/types/post.ts`
- `mobile/src/types/event.ts`
- `mobile/src/types/comment.ts`
- `mobile/src/types/reaction.ts`
- `mobile/src/types/favorite.ts`
- `mobile/src/types/report.ts`
- `mobile/src/types/subscription.ts`
- `mobile/src/types/notification.ts`
- `mobile/src/types/leaderboard.ts`
- `mobile/src/types/summary.ts`
- `mobile/src/types/gamification.ts`
- `mobile/src/types/user.ts`
- `mobile/src/repositories/*`
- `firestore.rules`
- `functions/index.js`

### Entity: AppProfile
- Source file: `mobile/src/types/profile.ts`
- Firestore path: `users/{userId}`
- Attributes:
  - `id`: `string`, required, Firebase Auth UID/profile document ID.
  - `email`: `string | null`, required, user email.
  - `role`: `UserRole`, required, one of `user`, `admin`, `organization`.
  - `xp`: `number`, required, gamification points.
  - `badgeKeys`: `BadgeKey[]`, required, unlocked badge keys.
  - `username`: `string`, required, display name.
  - `bio`: `string`, required, profile biography.
  - `language`: `'en' | 'ar'`, required, localization preference.
  - `privacyMode`: `boolean`, required, controls public leaderboard display.
  - `emailNotifications`: `boolean`, required, user preference.
  - `marketingEmails`: `boolean`, required, user preference.
  - `createdAt`: `unknown`, optional, server timestamp.
  - `updatedAt`: `unknown`, optional, server timestamp.
- Relationships:
  - One profile belongs to one Firebase Auth user.
  - Profile owns many `SpotPost` documents through `SpotPost.userId`.
  - Profile owns many `Favorite` documents under `users/{userId}/favorites`.
  - Profile owns many `AppNotification` documents under `users/{userId}/notifications`.
  - Profile has one current `UserSubscription`.
  - Profile XP is affected by backend-created `UserXpEvent` records.

### Entity: SpotPost
- Source file: `mobile/src/types/post.ts`
- Firestore path: `posts/{postId}`
- Attributes:
  - `id`: `string`, required, Firestore document ID.
  - `userId`: `string`, optional in UI type, required by create input and rules.
  - `placeId`: `string`, optional, external or local place reference.
  - `heroImageUrl`: `string`, optional, image URL.
  - `text`: `string`, required, post text.
  - `category`: `SpotCategory`, optional in UI type, required by create input/rules.
  - `displayCategory`: `string`, optional, UI display label.
  - `lat`: `number`, required, latitude.
  - `lng`: `number`, required, longitude.
  - `locationName`: `string`, optional, human-readable location label.
  - `createdAt`: `unknown`, optional, server timestamp.
- Relationships:
  - Many posts are created by one user.
  - One post has many `PostComment` records under `posts/{postId}/comments`.
  - One post has many `PostReaction` records under `posts/{postId}/reactions`.
  - One post can be saved by many users through `Favorite` documents.
  - One post can be targeted by many `ModerationReport` records.
  - Post creation triggers backend XP.

### Entity: PromotedEvent
- Source file: `mobile/src/types/event.ts`
- Firestore path: `events/{eventId}`
- Attributes:
  - `id`: `string`, required, Firestore document ID.
  - `placeId`: `string`, optional.
  - `title`: `string`, required.
  - `description`: `string`, required.
  - `category`: `SpotCategory`, required.
  - `locationName`: `string`, optional.
  - `venueName`: `string`, optional.
  - `organizerName`: `string`, optional.
  - `heroImageUrl`: `string`, optional.
  - `lat`: `number`, required.
  - `lng`: `number`, required.
  - `startTime`: `string`, required, ISO date/time string.
  - `endTime`: `string`, required, ISO date/time string.
  - `createdBy`: `string`, required, organization user ID.
  - `isPromoted`: `boolean`, required, true for promoted events.
  - `createdAt`: `unknown`, optional, server timestamp.
  - `status`: `EventStatus`, required, one of `active`, `hidden`, `cancelled`.
- Relationships:
  - Organization user creates many promoted events subject to plan limits.
  - Events appear in Home and Explore discovery views.
  - Client cannot directly create/update/delete events; Cloud Function owns creation.

### Entity: PostComment
- Source file: `mobile/src/types/comment.ts`
- Firestore path: `posts/{postId}/comments/{commentId}`
- Attributes:
  - `id`: `string`, required, Firestore document ID.
  - `postId`: `string`, required, parent post ID.
  - `userId`: `string`, required, author user ID.
  - `authorLabel`: `string`, required, display label.
  - `text`: `string`, required, comment text.
  - `createdAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A post has many comments.
  - A user creates many comments.
  - Comment creation triggers backend XP and may trigger a notification to the post owner.
  - A comment can be targeted by a moderation report in data model/rules.

### Entity: PostReaction
- Source file: `mobile/src/types/reaction.ts`
- Firestore path: `posts/{postId}/reactions/{userId}`
- Attributes:
  - `userId`: `string`, required, reacting user ID and document ID.
  - `postId`: `string`, required, parent post ID.
  - `type`: `'like'`, required, reaction type.
  - `createdAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A post has many reactions.
  - A user can have one like reaction per post.
  - Reaction creation may trigger XP and notification for post owner.

### Entity: Favorite
- Source file: `mobile/src/types/favorite.ts`
- Firestore path: `users/{userId}/favorites/{postId}`
- Attributes:
  - `userId`: `string`, required, owner user ID.
  - `postId`: `string`, required, saved post ID/document ID.
  - `createdAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A user has many favorites.
  - A favorite references one post.
  - Favorites drive saved spots in Home/Profile.

### Entity: ModerationReport
- Source file: `mobile/src/types/report.ts`
- Firestore path: `reports/{reportId}`
- Attributes:
  - `id`: `string`, required, Firestore document ID.
  - `reporterUserId`: `string`, required, reporting user ID.
  - `targetType`: `'post' | 'comment'`, required.
  - `targetId`: `string`, required, post ID or comment ID.
  - `targetPostId`: `string`, optional, parent post ID for comment reports.
  - `reason`: `ReportReason`, required, one of `spam`, `misleading`, `offensive`, `unsafe`, `other`.
  - `note`: `string`, optional.
  - `status`: `ReportStatus`, required, one of `open`, `reviewed`, `dismissed`, `action_taken`.
  - `createdAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A user creates many reports.
  - A report targets one post or one comment.
  - Admin updates report status.
  - Admin can hide target content.

### Entity: UserSubscription
- Source file: `mobile/src/types/subscription.ts`
- Firestore path: `users/{userId}/subscriptions/current`
- Attributes:
  - `userId`: `string`, required, owner user ID.
  - `planLevel`: `PlanLevel`, required, one of `free`, `organization_basic`, `organization_premium`.
  - `status`: `PlanStatus`, required, one of `active`, `inactive`, `trial`.
  - `createdAt`: `unknown`, optional, server timestamp.
  - `updatedAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A user has one current subscription document.
  - Subscription plan controls promoted event limits.
  - Admin can update plan/status.
  - Payment gateway is future work.

### Entity: AppNotification
- Source file: `mobile/src/types/notification.ts`
- Firestore path: `users/{userId}/notifications/{notificationId}`
- Attributes:
  - `id`: `string`, required, Firestore document ID.
  - `recipientUserId`: `string`, required.
  - `actorUserId`: `string`, required.
  - `actorLabel`: `string`, required.
  - `type`: `'comment_on_post' | 'like_on_post'`, required.
  - `postId`: `string`, required.
  - `commentId`: `string`, optional.
  - `message`: `string`, required.
  - `isRead`: `boolean`, required.
  - `createdAt`: `unknown`, optional, server timestamp.
  - `readAt`: `unknown`, optional, server timestamp.
- Relationships:
  - A user has many notifications.
  - Notifications are created by backend triggers.
  - Recipient can mark notifications as read.

### Entity: LeaderboardEntry
- Source file: `mobile/src/types/leaderboard.ts`
- Firestore path: derived response from `users` query, not stored as its own collection.
- Attributes:
  - `userId`: `string`, required.
  - `rank`: `number`, required.
  - `displayName`: `string`, required.
  - `xp`: `number`, required.
  - `role`: `UserRole`, required.
  - `badgeCount`: `number`, required.
  - `isCurrentUser`: `boolean`, required.
- Relationships:
  - Generated from `AppProfile` documents by `getLeaderboard` Cloud Function.
  - Respects `privacyMode` by replacing display name with a private label.

### Entity: SummarizeAreaRequest
- Source file: `mobile/src/types/summary.ts`
- Firestore path: none; callable function request body.
- Attributes:
  - `posts`: `SummarizableSpotPost[]`, required, list of visible posts.
- Relationships:
  - Sent from Explore screen to `summarizeArea` Cloud Function.
  - Backend validates up to 20 posts and clamps text length to 280 characters.

### Entity: SummarizeAreaResponse
- Source file: `mobile/src/types/summary.ts`
- Firestore path: none; callable function response body.
- Attributes:
  - `summary`: `string`, required, AI-generated area summary.
- Relationships:
  - Returned from `summarizeArea` Cloud Function to Explore UI.

Relationship summary:
- User owns many posts.
- User has many favorites.
- User has many notifications.
- User has one current subscription.
- User has many XP events.
- Post has many comments.
- Post has many reactions.
- Post can have many reports.
- Comment can have many reports in data model/rules.
- Organization user creates many promoted events subject to active event limit.
- Backend creates XP events and notifications.
- Leaderboard entries are derived from user profile XP.

==================================================
## 6. SERVICE AND REPOSITORY DIAGRAM DETAILS
==================================================

Sources used:
- `mobile/src/services/*`
- `mobile/src/repositories/*`
- `mobile/src/screens/**/*`
- `mobile/src/components/**/*`
- `functions/index.js`
- `firestore.rules`

| Domain | Service File | Repository File | Main Functions | Used By Screens | Backend/Firestore Dependencies |
| --- | --- | --- | --- | --- | --- |
| Auth | `mobile/src/services/authService.ts` | `mobile/src/repositories/authRepository.ts` | `observeAuthState`, `registerUser`, `loginUser`, `logoutUser`, `ensureRestoredUserAccount`, `getAuthErrorFeedback` | `LoginScreen`, `RegisterScreen`, `AuthContext`, navigators | Firebase Auth; Firestore user profile and subscription setup. |
| Profile | `mobile/src/services/profileService.ts` | `mobile/src/repositories/profileRepository.ts` | `createDefaultProfile`, `ensureDefaultProfile`, `loadCurrentUserProfile`, `observeCurrentUserProfile`, `saveCurrentUserProfile` | `ProfileScreen`, `AuthContext`, admin components | Firestore `users/{userId}`. |
| Posts | `mobile/src/services/postService.ts` | `mobile/src/repositories/postsRepository.ts` | `publishCurrentLocationPost`, `createPost`, `subscribeToPosts` | `PostScreen`, `HomeScreen`, `ExploreScreen`, `ProfileScreen` | Firestore `posts`; `onPostCreated` Cloud Function awards XP. |
| Discovery/Explore | `mobile/src/services/exploreService.ts`, `mobile/src/services/discoveryService.ts` | Uses post/event/favorite/comment/reaction repositories indirectly through screens | `filterExplorePosts`, `filterExploreEvents`, `buildDiscoverySpotItems`, `buildDiscoveryEventItems`, ranking/format helpers | `HomeScreen`, `ExploreScreen` | Firestore posts/events/favorites/comments/reactions. Client-side filtering/ranking. |
| Comments | `mobile/src/services/commentService.ts` | `mobile/src/repositories/commentRepository.ts` | `addCommentToPost`, `deleteOwnComment`, `observeCommentsForPost`, `observeCommentCountsByPost` | `PostInteractionPanel`, Home/Explore/Profile counts | Firestore `posts/{postId}/comments`; `onCommentCreated` Cloud Function. |
| Reactions | `mobile/src/services/reactionService.ts` | `mobile/src/repositories/reactionRepository.ts` | `togglePostLike`, `observeLikeUserIdsForPost`, `observeLikeCountsByPost` | `PostInteractionPanel`, Home/Explore/Profile counts | Firestore `posts/{postId}/reactions`; `onReactionWritten` Cloud Function. |
| Favorites | `mobile/src/services/favoriteService.ts` | `mobile/src/repositories/favoriteRepository.ts` | `toggleFavoritePost`, `observeFavoritePostIds` | Home, Explore, Profile | Firestore `users/{userId}/favorites/{postId}`. |
| Reports/Moderation | `mobile/src/services/reportService.ts`, `mobile/src/services/moderationService.ts` | `mobile/src/repositories/reportRepository.ts`, `mobile/src/repositories/moderationRepository.ts` | `submitReport`, `observeReports`, `reviewReportStatus`, `hideReportedTarget`, `createOrUpdateReport`, `updateReportStatus`, `hidePostById`, `hideCommentById` | `PostInteractionPanel`, `AdminConsolePanel` | Firestore `reports`, `posts`, `posts/{postId}/comments`; admin-only rules. |
| Events | `mobile/src/services/eventService.ts` | `mobile/src/repositories/eventRepository.ts` | `createPromotedEvent`, `subscribeToEvents`, `getActivePromotedEventsCountByCreator`, `subscribeToActivePromotedEventsCountByCreator` | `PostScreen`, Home, Explore | Callable `createPromotedEvent`; Firestore `events`; direct client writes denied. |
| Subscriptions | `mobile/src/services/subscriptionService.ts` | `mobile/src/repositories/subscriptionRepository.ts` | `createDefaultSubscription`, `ensureDefaultSubscription`, `loadUserSubscription`, `observeUserSubscription`, `getPromotedEventAccessState`, `updateUserPlan` | `PostScreen`, `ProfileScreen`, `AdminConsolePanel` | Firestore `users/{userId}/subscriptions/current`; admin plan updates. |
| Notifications | `mobile/src/services/notificationService.ts` | `mobile/src/repositories/notificationRepository.ts` | `observeNotifications`, `markUserNotificationRead`, backend helpers `createNotification`, `upsertLikeNotification` | Home, Profile | Firestore `users/{userId}/notifications`; backend creates; recipient marks read. |
| Analytics | `mobile/src/services/analyticsService.ts` | `mobile/src/repositories/analyticsRepository.ts` | `getAdminAnalytics`, `loadAdminAnalyticsSnapshot` | `AdminConsolePanel` | Firestore aggregate counts from users/posts/events/reports/comments/reactions/notifications. |
| Summaries | `mobile/src/services/summaryService.ts` | None; callable function wrapper | `summarizeAreaPosts` | `ExploreScreen`, `ExploreScreen.web` | Callable `summarizeArea`; OpenAI API backend call. |
| Leaderboard | `mobile/src/services/leaderboardService.ts` | Derived from Cloud Function; no direct repository | `loadLeaderboard` | `LeaderboardPanel`, `ProfileScreen` | Callable `getLeaderboard`; Firestore `users` ordered by XP. |
| Gamification | `mobile/src/services/gamificationService.ts` | `mobile/src/repositories/gamificationRepository.ts` | `awardPostCreationXp`, `awardCommentCreationXp`, `awardLikeReceivedXp`, `awardXpIfNotExists` | Mostly backend-owned in current architecture | Firestore `users/{userId}/xpEvents`; Cloud Functions are authoritative for XP in implemented trust model. |
| Localization | `mobile/src/context/LocalizationContext.tsx`, `mobile/src/i18n/index.ts` | None | `useLocalization`, translation lookup, locale/direction helpers | All main screens/components | Local client state and profile language setting. |
| Location | `mobile/src/services/locationService.ts`, `mobile/src/services/locationService.web.ts`, `mobile/src/services/locationPresets.ts` | None | `requestForegroundLocationPermission`, `getCurrentCoordinates`, `getLocationDisplayName`, `findLocationPreset`, `getLocationPresetLabel` | Post and Explore screens | Native/browser geolocation providers. |
| Organization | `mobile/src/services/organizationService.ts` | `mobile/src/repositories/profileRepository.ts` | `markUserAsOrganization` | `AdminConsolePanel` | Admin-only profile role update. |

==================================================
## 7. REGISTER / LOGIN FLOW DETAILS
==================================================

Sources used:
- `mobile/src/screens/auth/LoginScreen.tsx`
- `mobile/src/screens/auth/RegisterScreen.tsx`
- `mobile/src/services/authService.ts`
- `mobile/src/repositories/authRepository.ts`
- `mobile/src/services/profileService.ts`
- `mobile/src/services/subscriptionService.ts`
- `mobile/src/context/AuthContext.tsx`
- `mobile/src/navigation/AppNavigator.native.tsx`
- `mobile/src/navigation/AppNavigator.web.tsx`
- `firestore.rules`

Registration flow:
1. User opens Register screen from auth stack or web route.
2. User enters full name, email, password, confirm password, and accepts terms/privacy checkbox.
3. Register screen validates:
   - full name is not empty,
   - email is not empty,
   - password is not empty,
   - password and confirmation match,
   - terms are accepted.
4. Register screen calls `registerUser({ fullName, email, password })`.
5. `authService.registerUser` validates email/password and calls `registerWithEmail`.
6. `authRepository.registerWithEmail` calls Firebase Auth `createUserWithEmailAndPassword`.
7. `authService.registerUser` calls `createDefaultProfile` using user ID, email, and full name.
8. `profileService.createDefaultProfile` writes `users/{userId}` with default role `user`, XP `0`, badges `[]`, language `en`, privacy/settings defaults.
9. `authService.registerUser` calls `createDefaultSubscription`.
10. `subscriptionService.createDefaultSubscription` writes `users/{userId}/subscriptions/current` with plan `free` and status `active`.
11. Firebase Auth state changes.
12. `AuthContext` observes authenticated user, calls `ensureRestoredUserAccount`, and updates `currentUser`.
13. `AppNavigator` switches from Auth stack to Main tabs.

Login flow:
1. User opens Login screen.
2. User enters email and password.
3. Login screen validates email and password are present.
4. Login screen calls `loginUser({ email, password })`.
5. `authService.loginUser` calls `loginWithEmail`.
6. `authRepository.loginWithEmail` calls Firebase Auth `signInWithEmailAndPassword`.
7. `authService.loginUser` calls `ensureDefaultProfile` and `ensureDefaultSubscription`.
8. Missing profile/subscription records are created for restored or older accounts.
9. `AuthContext` receives auth state and stores authenticated identity.
10. Navigation switches to Main tabs.

Logout flow:
1. User taps sign out in Profile screen.
2. Profile screen calls `logoutUser`.
3. `authService.logoutUser` calls `logoutCurrentUser`.
4. `authRepository.logoutCurrentUser` calls Firebase Auth `signOut`.
5. `AuthContext` receives null user.
6. `AppNavigator` returns to auth flow or landing/login route.

Alternative/error flows:
- Email missing: screen shows localized validation error.
- Password missing: screen shows localized validation error.
- Confirm password mismatch: Register screen blocks submit.
- Terms not accepted: Register screen blocks submit.
- Firebase duplicate email, invalid email, wrong password, weak password, network failures: `getAuthErrorFeedback` maps Firebase auth code to user-facing feedback.
- Profile/subscription write failure after auth creation: registration/login reports failure; the account may exist in Auth but setup must be retried.
- Restored Firebase user with missing Firestore records: `ensureRestoredUserAccount` creates defaults.

==================================================
## 8. POST ACTIVITY UPDATE FLOW DETAILS
==================================================

Sources used:
- `mobile/src/screens/main/PostScreen.tsx`
- `mobile/src/screens/main/PostScreen.web.tsx`
- `mobile/src/services/postService.ts`
- `mobile/src/repositories/postsRepository.ts`
- `mobile/src/services/locationService.ts`
- `mobile/src/services/locationService.web.ts`
- `mobile/src/services/locationPresets.ts`
- `functions/index.js`
- `firestore.rules`

Screen involved:
- Native: `mobile/src/screens/main/PostScreen.tsx`
- Web: `mobile/src/screens/main/PostScreen.web.tsx`

Required inputs:
- Authenticated user.
- Post text, maximum 280 characters in service validation.
- Category: one of `fishing`, `event`, `sighting`, `weather`.
- Location from selected preset, location search, manual state, or current geolocation.

Optional inputs:
- `heroImageUrl` if it is a persistable HTTP(S) image URL.
- `placeId`.
- `locationName`.
- `displayCategory`.

Location behavior:
- User may choose a Qatar preset from `locationPresets`.
- User may use current device/browser location through `locationService`.
- `getLocationDisplayName` formats location as latitude/longitude text.
- If no override location is provided, `publishCurrentLocationPost` requests current coordinates.
- Browser geolocation requires HTTPS or localhost, as noted in `locationService.web.ts`.

Validation rules:
- User must be authenticated.
- Post text must not be empty.
- Post text must be 280 characters or fewer.
- Category must be valid.
- Latitude and longitude must be numbers.
- Optional `heroImageUrl` must be HTTP(S) if persisted.
- Firestore rules require `userId` to match `request.auth.uid`.

Main flow:
1. User enters update text in Post screen.
2. User selects a category and location.
3. User taps publish.
4. Post screen calls `publishCurrentLocationPost`.
5. `postService` validates user, text length, image URL, and location/category.
6. If location override exists, it is used. Otherwise `locationService.getCurrentCoordinates` is called.
7. `postService` calls `postsRepository.createPost`.
8. `postsRepository.createPost` writes a document to `posts/{postId}` with `serverTimestamp()`.
9. Firestore rules validate ownership, required fields, category, and text length.
10. Cloud Function `onPostCreated` runs for `posts/{postId}`.
11. Backend awards 10 XP using event ID `post_created_{postId}`.
12. Backend writes XP event under `users/{userId}/xpEvents/{eventId}` and increments `users/{userId}.xp`.
13. Home/Explore/Profile subscriptions receive updated post data.
14. UI clears or updates form state and displays success feedback.

Error flows:
- Empty text: service throws `Post text cannot be empty.`
- Text over 280 characters: service throws `Keep the update under 280 characters.`
- Invalid category: screen/service blocks or rules reject write.
- Missing location: location permission/current coordinate failure returns `Could not read your current location.`
- Unauthenticated user: service throws `You must be signed in to post.`
- Invalid image URL: service throws `Only secure image URLs can be attached for now.`
- Firestore write failure: UI shows error feedback through alert/toast handling.
- XP trigger failure: post remains created; backend log/function issue must be checked separately.

==================================================
## 9. EXPLORE AND AI SUMMARY FLOW DETAILS
==================================================

Sources used:
- `mobile/src/screens/main/ExploreScreen.tsx`
- `mobile/src/screens/main/ExploreScreen.web.tsx`
- `mobile/src/components/explore/ExploreMapSurface.web.tsx`
- `mobile/src/components/explore/PostInteractionPanel.tsx`
- `mobile/src/services/exploreService.ts`
- `mobile/src/services/discoveryService.ts`
- `mobile/src/services/summaryService.ts`
- `mobile/src/repositories/postsRepository.ts`
- `mobile/src/repositories/eventRepository.ts`
- `mobile/src/repositories/favoriteRepository.ts`
- `mobile/src/repositories/commentRepository.ts`
- `mobile/src/repositories/reactionRepository.ts`
- `functions/index.js`
- `firestore.rules`

Screens involved:
- Native Explore: `mobile/src/screens/main/ExploreScreen.tsx`
- Web Explore: `mobile/src/screens/main/ExploreScreen.web.tsx`
- Web map surface: `mobile/src/components/explore/ExploreMapSurface.web.tsx`

Data subscriptions:
- Posts: `subscribeToPosts`.
- Events: `subscribeToEvents`.
- Favorites: `observeFavoritePostIds`.
- Comment counts: `observeCommentCountsByPost`.
- Like counts: `observeLikeCountsByPost`.

Filtering/search behavior:
- `filterExplorePosts` and `filterExploreEvents` filter by selected category and search text.
- Search text can match content, location, title, venue, or category-related labels.
- Explore builds discovery cards using `buildDiscoverySpotItems` and `buildDiscoveryEventItems`.
- Client tracks map region/visible area and selected card state.

Map provider/native/web differences:
- Native uses `react-native-maps`, `MapView`, `Marker`, and `Heatmap`.
- Native map provider is `PROVIDER_GOOGLE`.
- Web uses Leaflet via `react-leaflet`, plus `leaflet.heat`.
- Web tile attribution uses CARTO/OpenStreetMap tiles through Leaflet configuration.
- Android native map may require a Google Maps API key as stated in `mobile/REAL_DEVICE_RUN.md`.

Summary request input:
- `summaryService.summarizeAreaPosts(posts)` receives visible/summarizable posts.
- Request shape: `SummarizeAreaRequest` with `posts: SummarizableSpotPost[]`.
- Each post includes text and category.

Client-side responsibilities:
- Subscribe to posts/events.
- Filter/sort/rank visible items.
- Determine which posts are visible/relevant for area summary.
- Call `summaryService.summarizeAreaPosts`.
- Display loading, summary text, or error state.

Cloud Function responsibilities:
- `summarizeArea` requires authentication.
- Validates `posts` array is present and non-empty.
- Limits request to first 20 posts.
- Validates each text and category.
- Truncates/clamps post text to safe length.
- Calls OpenAI with a concise Qatar-focused area summary prompt.
- Returns `{ summary }`.
- Maps missing OpenAI key to `failed-precondition`.
- Maps quota/rate limit to `resource-exhausted`.

OpenAI responsibilities:
- Generate a concise area summary from validated post snippets.
- OpenAI is not called directly from the client.

Firestore responsibilities:
- Store posts/events used by Explore.
- Enforce authenticated read access.
- Hide posts marked `isHidden` through repository filtering and moderation fields.

Main flow:
1. User opens Explore screen.
2. Screen subscribes to posts, events, favorites, comments, and likes.
3. Screen renders map markers/heat layer and discovery cards.
4. User applies category/search filters or moves map.
5. Screen computes visible posts.
6. User taps area summary action.
7. `summaryService.summarizeAreaPosts` calls callable function `summarizeArea`.
8. `summarizeArea` validates auth and post payload.
9. Cloud Function calls OpenAI API.
10. Cloud Function returns summary text.
11. Explore screen displays summary panel/card.

Error handling:
- No posts selected: client/function reports that there is not enough activity to summarize.
- Function not deployed/emulator not running: `summaryService` maps to deployment/backend unavailable messaging.
- Missing OpenAI key: user-facing message indicates AI summaries are not configured.
- OpenAI quota/rate limit: user-facing message indicates quota/rate limit.
- Network/function internal error: generic summary failure message.

==================================================
## 10. PROMOTED EVENT FLOW DETAILS
==================================================

Sources used:
- `mobile/src/screens/main/PostScreen.tsx`
- `mobile/src/screens/main/PostScreen.web.tsx`
- `mobile/src/services/eventService.ts`
- `mobile/src/services/subscriptionService.ts`
- `mobile/src/repositories/eventRepository.ts`
- `mobile/src/repositories/subscriptionRepository.ts`
- `mobile/src/components/profile/AdminConsolePanel.tsx`
- `functions/index.js`
- `firestore.rules`

Actor:
- Organization User.

Preconditions:
- User is authenticated.
- User profile role is `organization`.
- User has current subscription document.
- Subscription status is `active` or `trial`.
- Plan level is `organization_basic` or `organization_premium`.
- Active promoted event count is below plan limit.

Required role:
- `organization`.

Subscription/plan requirements:
- `free`: 0 active promoted events.
- `organization_basic`: 1 active promoted event.
- `organization_premium`: 5 active promoted events.
- `active` or `trial` status is allowed.
- `inactive` status is denied.

Event input fields:
- `title`: required.
- `description`: required.
- `category`: required valid category.
- `locationName`: optional but usually provided.
- `lat`: required.
- `lng`: required.
- `startTime`: required valid date/time.
- `endTime`: required valid date/time after start time.
- `heroImageUrl`: optional HTTP(S) URL if provided.

Client-side validation:
- User must be logged in.
- Role must be organization.
- Access state from `getPromotedEventAccessState` must allow event creation.
- Title and description must be present.
- Start and end dates must be valid.
- End time must be after start time.
- Location must be selected or available.

Cloud Function name:
- `createPromotedEvent`

Backend validation:
- Requires callable auth context.
- Validates title, description, category, latitude, longitude.
- Validates start/end date order.
- Reads user profile from `users/{uid}`.
- Reads subscription from `users/{uid}/subscriptions/current`.
- Confirms role is `organization`.
- Confirms plan/status eligibility.
- Counts active events for the creator.
- Rejects if active event count is at or above plan limit.
- Writes event to `events/{eventId}` with status `active`, `isPromoted: true`, `createdBy: uid`, and server timestamp.

Firestore path:
- `events/{eventId}`

Active event limit behavior:
- Basic organization plan: maximum 1 active promoted event.
- Premium organization plan: maximum 5 active promoted events.
- Limit is enforced in the backend callable, not only in the UI.

Error cases:
- Unauthenticated user: callable returns `unauthenticated`.
- Non-organization role: callable returns `permission-denied`.
- Missing/inactive/free subscription: callable returns `permission-denied` or failed access state.
- Invalid title/description/category/coordinates/dates: callable returns `invalid-argument`.
- Active event limit reached: callable returns `failed-precondition`.
- Direct Firestore event write from client: denied by Firestore rules.

Implemented vs future work:
- Implemented: role/plan/subscription model, admin plan updates, backend callable event creation, active event quota, event display in Home/Explore.
- Future work: payment gateway integration, self-service billing, richer event promotion options, production campaign analytics.

==================================================
## 11. REPORT AND MODERATION FLOW DETAILS
==================================================

Sources used:
- `mobile/src/components/explore/PostInteractionPanel.tsx`
- `mobile/src/components/profile/AdminConsolePanel.tsx`
- `mobile/src/services/reportService.ts`
- `mobile/src/services/moderationService.ts`
- `mobile/src/repositories/reportRepository.ts`
- `mobile/src/repositories/moderationRepository.ts`
- `mobile/src/types/report.ts`
- `firestore.rules`

User report flow:
1. Authenticated user opens a post interaction panel.
2. User selects a report reason.
3. UI calls `submitReport`.
4. `reportService.submitReport` validates authenticated user and target data.
5. `reportRepository.createOrUpdateReport` writes a report document to `reports/{reportId}`.
6. Firestore rules validate reporter identity, target type, reason, status `open`, and target existence.
7. Admin console receives open report through `observeReports`.

Report target types:
- `post`.
- `comment`.

Important implementation note:
- Data model, service, repository, rules, and moderation repository support post and comment targets.
- The visible `PostInteractionPanel` reporting path found in code reports posts.
- A clear comment-specific report button was not found in the inspected UI.

Report reasons:
- `spam`
- `misleading`
- `offensive`
- `unsafe`
- `other`

Firestore report path:
- `reports/{reportId}`

Report document fields:
- `reporterUserId`
- `targetType`
- `targetId`
- `targetPostId`
- `reason`
- `note`
- `status`
- `createdAt`

Admin review flow:
1. Admin opens Profile screen.
2. `AdminConsolePanel` is shown only when current profile role is `admin`.
3. Admin console calls `observeReports('admin')`.
4. Admin can set report status to reviewed/dismissed/action taken.
5. Admin can hide reported target using `hideReportedTarget`.
6. `moderationService.hideReportedTarget` verifies admin role and target type.
7. For post report, `hidePostById` updates post with `isHidden: true` and `moderationStatus: 'hidden'`.
8. For comment report, `hideCommentById` updates comment with `isHidden: true` and `moderationStatus: 'hidden'`.
9. Report status is updated to `action_taken`.

Moderation status fields:
- On post/comment: `isHidden: true`, `moderationStatus: 'hidden'`.
- On report: `status` becomes `reviewed`, `dismissed`, or `action_taken`.

Security rule restrictions:
- Create reports: signed-in users only, reporter ID must match auth UID.
- Read reports: admin only.
- Update reports: admin only; only status/updatedAt can change.
- Hide posts/comments: admin-only moderation update according to rules.
- Delete reports: denied.
- Direct non-admin content hiding: denied.

Roles:

| Operation | User | Organization User | Admin | Backend |
| --- | --- | --- | --- | --- |
| Create reports | Allowed if signed in | Allowed if signed in | Allowed if signed in | Not primary path |
| Read reports | Denied | Denied | Allowed | Allowed through admin SDK if needed |
| Update report status | Denied | Denied | Allowed | Allowed through admin SDK if needed |
| Hide post/comment | Owner can edit/delete own content, but cannot perform moderation hide | Same as user | Allowed for moderation hide | Allowed through admin SDK if needed |

Error cases:
- Unauthenticated report submit: service rejects.
- Invalid target type/reason: service or rules reject.
- Missing target post/comment: rules reject.
- Non-admin reading/updating reports: rules reject.
- Comment report without `targetPostId`: moderation hide flow cannot locate parent post.

==================================================
## 12. XP, NOTIFICATION, AND LEADERBOARD FLOW DETAILS
==================================================

Sources used:
- `functions/index.js`
- `mobile/src/services/notificationService.ts`
- `mobile/src/repositories/notificationRepository.ts`
- `mobile/src/services/leaderboardService.ts`
- `mobile/src/components/profile/LeaderboardPanel.tsx`
- `mobile/src/services/gamificationService.ts`
- `mobile/src/repositories/gamificationRepository.ts`
- `mobile/src/types/gamification.ts`
- `mobile/src/types/notification.ts`
- `mobile/src/types/leaderboard.ts`
- `firestore.rules`

XP amounts:
- `post_created`: 10 points.
- `comment_created`: 4 points.
- `post_liked_received`: 2 points.

Backend trigger details:

| Trigger | Actor | Backend Function | Firestore Writes | UI Result | Notes |
| --- | --- | --- | --- | --- | --- |
| Post created | Authenticated user | `onPostCreated` | `users/{userId}/xpEvents/post_created_{postId}` and increment `users/{userId}.xp` | Profile XP and leaderboard can update. | Idempotent XP event prevents duplicate award. |
| Comment created | Authenticated user | `onCommentCreated` | XP event for commenter; notification under post owner's `notifications` subcollection if not self-action | Post owner sees in-app notification; commenter gains XP. | Self-comment on own post does not create notification. |
| Like reaction created | Authenticated user | `onReactionWritten` | XP event for post owner; like notification upsert under post owner if not self-action | Post owner sees in-app notification; owner gains XP. | Only create transition triggers; updates/deletes do not award XP. |
| Notification read | Notification recipient | No Cloud Function; client update | Update `users/{uid}/notifications/{notificationId}` with `isRead: true`, `readAt` | Notification unread count decreases. | Rules allow recipient read update only. |
| Leaderboard loaded | Authenticated user | `getLeaderboard` callable | No write; reads `users` ordered by XP | `LeaderboardPanel` displays ranked entries. | Privacy mode replaces display name. |

XP event path:
- `users/{userId}/xpEvents/{eventId}`

Notification path:
- `users/{userId}/notifications/{notificationId}`

Notification types:
- `comment_on_post`
- `like_on_post`

Self-action prevention:
- Comment notification skips when `recipientUserId === actorUserId`.
- Like notification skips when `recipientUserId === actorUserId`.
- Current backend code does not skip the like-received XP award when the actor is also the post owner; it calls `awardXpIfNeeded(recipientUserId, ...)` before/alongside the notification helper. If the intended policy is to prevent self-like XP, this should be shown as a required backend fix rather than as implemented behavior.

Leaderboard Cloud Function:
- `getLeaderboard`

Leaderboard behavior:
- Requires auth.
- Accepts optional limit, clamped to a safe range from 3 to 25.
- Reads user profiles ordered by `xp` descending.
- Returns rank, display name, XP, role, badge count, and `isCurrentUser`.
- If profile `privacyMode` is true, display name becomes `"Private Spots user"`.

UI screens involved:
- `ProfileScreen.tsx`
- `ProfileScreen.web.tsx`
- `LeaderboardPanel.tsx`
- Home/Profile notification indicators.

Implementation note:
- `gamificationService.ts` and `gamificationRepository.ts` include client-side XP helper functions, but the current trust model relies on Cloud Functions for authoritative XP writes.
- Firestore rules deny client writes to `xpEvents`, so backend functions are the valid production path.

==================================================
## 13. DATABASE / FIRESTORE MODEL DETAILS
==================================================

Sources used:
- `firestore.rules`
- `functions/index.js`
- `mobile/src/repositories/*`
- `mobile/src/types/*`
- `tests/backend-trust.test.cjs`

| Path | Purpose | Key Fields | Read | Create | Update | Delete | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `users/{userId}` | User profile and role/XP/settings record. | `email`, `role`, `xp`, `badgeKeys`, `username`, `bio`, `language`, `privacyMode`, `emailNotifications`, `marketingEmails`, `createdAt`, `updatedAt` | Self or admin | Self only; role must be `user`, XP must be 0 | Self can update safe profile/settings fields; admin can update role only | Denied | XP changes are backend-owned through Admin SDK. |
| `users/{userId}/favorites/{postId}` | Saved/favorite posts. | `userId`, `postId`, `createdAt` | Self or admin | Self only if post exists and IDs match | Denied | Self only | Used by Home/Profile/Explore saved states. |
| `users/{userId}/notifications/{notificationId}` | In-app notifications. | `recipientUserId`, `actorUserId`, `actorLabel`, `type`, `postId`, `commentId`, `message`, `isRead`, `createdAt`, `readAt` | Self or admin | Denied to client | Recipient can mark as read only | Denied | Created by Cloud Functions. |
| `users/{userId}/subscriptions/current` | Current subscription/plan state. | `userId`, `planLevel`, `status`, `createdAt`, `updatedAt` | Self or admin | Self only with default free/active | Admin only for valid plan/status | Denied | Payment integration not implemented. Admin updates plan in MVP. |
| `users/{userId}/xpEvents/{eventId}` | Idempotent XP event log. | `type`, `points`, `createdAt` | Self or admin | Denied to client | Denied | Denied | Created by Cloud Functions/Admin SDK. |
| `posts/{postId}` | Local activity update. | `userId`, `text`, `category`, `displayCategory`, `lat`, `lng`, `placeId`, `heroImageUrl`, `locationName`, `createdAt`, `isHidden`, `moderationStatus` | Signed-in users | Signed-in owner with valid fields | Owner can update safe content fields; admin can set hidden moderation fields | Owner only | Repository filters hidden posts from normal feed. |
| `posts/{postId}/comments/{commentId}` | Comments under a post. | `postId`, `userId`, `authorLabel`, `text`, `createdAt`, `isHidden`, `moderationStatus` | Signed-in users | Signed-in owner with valid fields and existing post | Owner can edit text; admin can set hidden moderation fields | Owner only | Collection group read is also allowed to signed-in users for count aggregation. |
| `posts/{postId}/reactions/{userId}` | Like reaction under a post. | `userId`, `postId`, `type`, `createdAt` | Signed-in users | Self only, type `like`, post exists | Self only, type `like` | Self only | Collection group read allowed to signed-in users for count aggregation. |
| `events/{eventId}` | Promoted event documents. | `title`, `description`, `category`, `locationName`, `lat`, `lng`, `startTime`, `endTime`, `createdBy`, `isPromoted`, `status`, `createdAt`, `heroImageUrl` | Signed-in users | Denied to client | Denied to client | Denied to client | Created only by `createPromotedEvent` Cloud Function. |
| `reports/{reportId}` | User-generated moderation reports. | `reporterUserId`, `targetType`, `targetId`, `targetPostId`, `reason`, `note`, `status`, `createdAt`, `updatedAt` | Admin only | Signed-in reporter only, valid target/reason/status | Admin only, status/updatedAt only | Denied | Used by `AdminConsolePanel`. |
| `/{path=**}/comments/{commentId}` | Collection group comments read. | Same as comment document | Signed-in users | Covered by concrete post path | Covered by concrete post path | Covered by concrete post path | Used by analytics/count repository. |
| `/{path=**}/reactions/{userId}` | Collection group reactions read. | Same as reaction document | Signed-in users | Covered by concrete post path | Covered by concrete post path | Covered by concrete post path | Used by analytics/count repository. |
| `/{path=**}/notifications/{notificationId}` | Collection group notifications read for analytics. | Same as notification document | Admin only | Covered by concrete user path | Covered by concrete user path | Covered by concrete user path | Used by admin analytics. |
| Fallback `/{document=**}` | Any unspecified path. | Any | Denied | Denied | Denied | Denied | Default deny. |

Backend-only collections/paths:
- `events/{eventId}` create/update/delete.
- `users/{userId}/xpEvents/{eventId}` write.
- `users/{userId}.xp` increments.
- `users/{userId}/notifications/{notificationId}` create/upsert.

Client-accessible paths:
- User can read own profile, favorites, notifications, subscription, XP events.
- User can create/update own profile safe fields through profile service.
- User can create own posts/comments/reactions/favorites/reports subject to rules.
- Signed-in users can read posts/events/comments/reactions.
- Admin can read reports and perform moderation/admin updates.

==================================================
## 14. UI SCREENSHOT / WIREFRAME DETAILS
==================================================

Sources used:
- `mobile/src/screens/auth/LoginScreen.tsx`
- `mobile/src/screens/auth/RegisterScreen.tsx`
- `mobile/src/screens/main/HomeScreen.tsx`
- `mobile/src/screens/main/HomeScreen.web.tsx`
- `mobile/src/screens/main/ExploreScreen.tsx`
- `mobile/src/screens/main/ExploreScreen.web.tsx`
- `mobile/src/components/explore/ExploreMapSurface.web.tsx`
- `mobile/src/screens/main/PostScreen.tsx`
- `mobile/src/screens/main/PostScreen.web.tsx`
- `mobile/src/screens/main/ProfileScreen.tsx`
- `mobile/src/screens/main/ProfileScreen.web.tsx`
- `mobile/src/components/profile/AdminConsolePanel.tsx`
- `mobile/src/components/profile/LeaderboardPanel.tsx`

### Screen: Login/Register
- Source files:
  - `mobile/src/screens/auth/LoginScreen.tsx`
  - `mobile/src/screens/auth/RegisterScreen.tsx`
- Main visible UI elements:
  - Spots branding.
  - Authentication header/collage.
  - Email and password fields.
  - Register form full name, confirm password, terms/privacy checkbox.
  - Show/hide password control.
  - Error text area.
  - Sign In/Create Account button.
  - Link between login and register screens.
- Main user actions:
  - Register new account.
  - Log in existing account.
  - Toggle password visibility.
  - Navigate between auth screens.
- Data displayed:
  - Localized labels/errors.
- Recommended screenshot state:
  - Show Register screen with fields filled using non-sensitive sample values and terms checkbox selected.
  - Also capture Login screen with empty/default state if report needs both.

### Screen: Home
- Source files:
  - `mobile/src/screens/main/HomeScreen.tsx`
  - `mobile/src/screens/main/HomeScreen.web.tsx`
- Main visible UI elements:
  - Header with user/avatar and notification/unread indicator.
  - Search/hero discovery area.
  - Category chips.
  - For You section.
  - Trending Nearby section.
  - Popular Events section.
  - Saved Spots Updates section.
  - Data warning/empty states when data is unavailable.
- Main user actions:
  - Search discovery items.
  - Filter by category.
  - Open post/event details.
  - Navigate to Explore/Post/Profile tabs.
- Data displayed:
  - Posts, promoted events, saved favorite states, comment counts, like counts, notification indicators.
- Recommended screenshot state:
  - User logged in.
  - At least three sample posts and one promoted event exist.
  - One saved spot and unread notification indicator visible.
  - Category filter chips visible.

### Screen: Explore Map
- Source files:
  - `mobile/src/screens/main/ExploreScreen.tsx`
  - `mobile/src/screens/main/ExploreScreen.web.tsx`
  - `mobile/src/components/explore/ExploreMapSurface.web.tsx`
  - `mobile/src/components/explore/PostInteractionPanel.tsx`
- Main visible UI elements:
  - Map with post/event markers.
  - Heatmap/heat layer.
  - Search fields.
  - Category filters.
  - Discovery cards/list.
  - Summary button/panel.
  - Favorite/comment/like/report controls.
  - Selected spot/event detail panel.
- Main user actions:
  - Move map or use current location.
  - Filter/search posts and events.
  - Select marker/card.
  - Save favorite.
  - Like/comment/report post.
  - Request AI area summary.
- Data displayed:
  - Location-aware posts, promoted events, social counts, saved state, AI summary.
- Recommended screenshot state:
  - User logged in.
  - Map visible with several markers.
  - A category filter selected.
  - A detail card or interaction panel open.
  - Summary panel visible if possible.
  - For native Android screenshot, confirm Google Maps API key is configured.

### Screen: Post
- Source files:
  - `mobile/src/screens/main/PostScreen.tsx`
  - `mobile/src/screens/main/PostScreen.web.tsx`
  - `mobile/src/components/post/StudioPanel.tsx`
- Main visible UI elements:
  - Activity update text input.
  - Category selection.
  - Location search/preset/current location controls.
  - Optional image/media preview controls.
  - Publish button.
  - Promoted event form/section for organization access.
  - Subscription/plan access messaging.
- Main user actions:
  - Create activity update.
  - Select Qatar area/preset or current location.
  - Add optional image URL/sample media.
  - Create promoted event if organization role and eligible plan.
- Data displayed:
  - Selected category, selected location, plan/quota state, posting status.
- Recommended screenshot state:
  - User logged in.
  - Post text filled.
  - Category selected.
  - Qatar location selected.
  - Publish button visible.
  - For organization user screenshot, event title/description/date fields visible.

### Screen: Profile
- Source files:
  - `mobile/src/screens/main/ProfileScreen.tsx`
  - `mobile/src/screens/main/ProfileScreen.web.tsx`
  - `mobile/src/components/profile/AccountSummaryCard.tsx`
  - `mobile/src/components/profile/LeaderboardPanel.tsx`
- Main visible UI elements:
  - User account summary.
  - Role/plan information.
  - XP/stat metrics.
  - Leaderboard panel.
  - Saved spots and recent activity.
  - Notification list/unread state.
  - Profile settings fields for username, bio, language, privacy, emails.
  - Save and sign out buttons.
- Main user actions:
  - Edit username/bio/settings.
  - Toggle privacy/language/email options.
  - Mark notifications read.
  - Refresh leaderboard.
  - Sign out.
- Data displayed:
  - Profile, subscription, XP, badges, favorite posts, notifications, leaderboard entries.
- Recommended screenshot state:
  - User logged in with non-empty XP.
  - Leaderboard has multiple sample users.
  - One or more saved spots.
  - Profile edit fields visible.

### Screen: Admin Console
- Source file:
  - `mobile/src/components/profile/AdminConsolePanel.tsx`
- Main visible UI elements:
  - Admin analytics metric tiles.
  - User ID input for account management.
  - Plan level and status selectors.
  - Update plan button.
  - Make organization button.
  - Report list.
  - Review/dismiss/hide controls.
- Main user actions:
  - View analytics snapshot.
  - Update subscription plan/status.
  - Mark a user as organization.
  - Review, dismiss, or action reports.
  - Hide reported content.
- Data displayed:
  - Counts for users/posts/events/reports/comments/likes/notifications/organizations.
  - Reports by status.
  - Posts/events by category.
  - Open report details.
- Recommended screenshot state:
  - Admin user logged in.
  - At least one open report exists.
  - Analytics metrics loaded.
  - Target user ID field contains a sample UID.
  - Plan controls visible.

==================================================
## 15. FINAL OUTPUT FOR DIAGRAM GENERATION
==================================================

| Figure | Recommended Diagram Notation | Required Information Readiness | Missing Details |
| --- | --- | --- | --- |
| Figure 1: Use Case Diagram | UML use case diagram or Mermaid flowchart-style use case approximation | Ready | None. Use UC01-UC18 table and actor list above. |
| Figure 2: Gantt Chart | Mermaid `gantt`, Microsoft Project, Excel, or PowerPoint timeline | Partially ready | Exact task dates, assigned team members, and approved dependencies require team input. |
| Figure 3: High-Level Architecture Diagram | Layered architecture diagram, C4 container diagram, or PowerPoint architecture diagram | Ready | Confirm production deployment details if shown. Payment/push/media upload should be dashed future services. |
| Figure 4: Structural/Class Model | UML class diagram or Mermaid `classDiagram` | Ready | Server timestamp concrete runtime type can be shown as `Timestamp/serverTimestamp`. |
| Figure 5: Service/Repository Diagram | Component diagram, Mermaid `flowchart`, or UML component diagram | Ready | None for MVP. |
| Figure 6: Register/Login Flow | UML sequence diagram, Mermaid `sequenceDiagram`, or flowchart | Ready | None. |
| Figure 7: Post Activity Update Flow | UML sequence diagram or Mermaid `sequenceDiagram` | Ready | Add screenshot evidence separately in report. |
| Figure 8: Explore and AI Summary Flow | UML sequence diagram or Mermaid `sequenceDiagram` | Ready | OpenAI production configuration evidence not available. |
| Figure 9: Promoted Event Flow | UML sequence diagram or Mermaid `sequenceDiagram` | Ready | Payment gateway is future work only. |
| Figure 10: Report and Moderation Flow | UML sequence diagram or Mermaid `sequenceDiagram` | Partially ready | Comment report UI path is unclear; post report flow is ready. |
| Figure 11: XP, Notification, and Leaderboard Flow | UML sequence diagram or Mermaid `sequenceDiagram` | Ready | Production push notifications are future work only. |
| Figure 12: Login/Register Screenshot | Real app screenshot or annotated wireframe | Missing team input | Capture from running app. |
| Figure 13: Home Screenshot | Real app screenshot or annotated wireframe | Missing team input | Capture from running app with sample data. |
| Figure 14: Explore Map Screenshot | Real app screenshot or annotated wireframe | Missing team input | Capture map with markers/summary; configure Android map key if using native Android. |
| Figure 15: Post Screenshot | Real app screenshot or annotated wireframe | Missing team input | Capture post creation form, optionally organization event form. |
| Figure 16: Profile Screenshot | Real app screenshot or annotated wireframe | Missing team input | Capture profile with leaderboard/saved spots/notifications. |
| Figure 17: Admin Console Screenshot | Real app screenshot or annotated wireframe | Missing team input | Requires admin account and sample report data. |

Compact generation checklist:
- Figure 1: Use Case Diagram - use actors Guest, Authenticated User, Organization User, Admin, Firebase Backend, OpenAI API, Map/Geolocation Provider; include UC01-UC18.
- Figure 2: Gantt Chart - use M1-M8 and T1-T12; mark unknown dates/team assignments for team completion.
- Figure 3: High-Level Architecture Diagram - show Presentation, Service, Repository, Backend, External Services, and Future Optional Services.
- Figure 4: Structural/Class Model - use AppProfile, SpotPost, PromotedEvent, PostComment, PostReaction, Favorite, ModerationReport, UserSubscription, AppNotification, LeaderboardEntry, SummarizeAreaRequest, SummarizeAreaResponse.
- Figure 5: Service/Repository Diagram - map screens to services, repositories, Firestore, callables, and Cloud Functions.
- Figure 6: Register/Login Flow - show Firebase Auth, profile/subscription initialization, AuthContext, and navigation.
- Figure 7: Post Activity Update Flow - show post validation, location, Firestore write, `onPostCreated`, XP, and feed update.
- Figure 8: Explore and AI Summary Flow - show subscriptions, filters, visible posts, `summarizeArea`, OpenAI, and summary UI.
- Figure 9: Promoted Event Flow - show organization role, subscription access, callable validation, event write, and quota behavior.
- Figure 10: Report and Moderation Flow - show report creation, admin review, status update, and hide target.
- Figure 11: XP, Notification, and Leaderboard Flow - show `onPostCreated`, `onCommentCreated`, `onReactionWritten`, notifications, and `getLeaderboard`.
