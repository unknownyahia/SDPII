# Spots Mobile Full Project Report

## 1. Executive Summary

Spots Mobile is a Qatar-focused local discovery application built as a React Native CLI mobile app with Firebase backend services. The project addresses a practical problem in Qatar: local information about places, events, community updates, and real-time activity is scattered across social media, messaging groups, maps, and word of mouth. Spots Mobile consolidates that information into one structured mobile experience where users can discover nearby activity, browse community posts, view promoted events, interact with content, save useful spots, and manage their profile.

The system is designed around a mobile-first user experience, real-time Firestore data, location-aware discovery, backend trust enforcement, AI area summaries, gamification, moderation, and bilingual English/Arabic support. The active implementation is in the `mobile/` directory and uses React Native CLI rather than the older archived Expo proof of concept. Supporting backend functionality lives in `functions/`, `firestore.rules`, and `tests/`, because the mobile app depends on Firebase Cloud Functions and Firestore Security Rules for trusted operations.

The final defense presentation covers the problem, motivation, proposed solution, target users, MVP features, high-level architecture, backend design, AI summary flow, security and moderation, implementation screens, testing, results, limitations, future work, and conclusion. This report expands those same topics using evidence from the actual project files.

## 2. Problem Statement

Residents, students, visitors, and organizations in Qatar often need local information that is timely, trustworthy, and relevant to their current area. In practice, this information is fragmented across Instagram pages, WhatsApp groups, Google Maps entries, event posters, personal recommendations, and organization accounts. This creates three main problems:

1. Users must search across many channels to understand what is happening nearby.
2. Global discovery platforms do not focus on Qatar-specific community needs.
3. Local organizations do not have a unified channel to publish promoted events and reach nearby users.

Spots Mobile responds to this gap by offering a dedicated local discovery platform for Qatar.

## 3. Project Objectives

The project objectives are:

1. Build a mobile application that centralizes local discovery for Qatar.
2. Allow users to browse nearby posts, places, and promoted events.
3. Provide an interactive map with pins, category filters, and heatmap-style activity signals.
4. Support user-generated local posts with location metadata.
5. Support comments, likes, reports, saved spots, notifications, and profile management.
6. Provide organization accounts with controlled promoted event publishing.
7. Use Firebase backend services to enforce trust-sensitive operations.
8. Add AI area summaries through a backend-secured OpenAI integration.
9. Add gamification through XP and leaderboard ranking.
10. Support English and Arabic localization, including RTL-aware layout behavior.

## 4. Target Users

The application is designed for four main user groups:

Students: Students can discover campus and off-campus spots, study places, food areas, events, and peer-shared updates near their university.

Residents: Local and expatriate residents can find community-verified recommendations and nearby activity without relying only on generic global apps.

Visitors: Short-term visitors can quickly understand useful local areas, active places, and promoted events in Qatar.

Organizations: Businesses, universities, and community groups can manage organization profiles and publish promoted events when their role and subscription plan allow it.

The system also supports administrators who review reports, manage subscriptions, update user roles, and view analytics.

## 5. Scope and MVP

The MVP includes:

- Email/password authentication.
- Automatic profile and subscription setup for new or returning users.
- Home discovery feed.
- Explore map with posts, events, user location, pins, and heatmap support.
- Category filtering and search.
- Local post creation.
- Promoted event creation for eligible organization users.
- Comments, likes, reports, and saved spots.
- Notifications for comment and like activity.
- XP awards and leaderboard.
- Profile settings, language preference, privacy mode, and sign out.
- Admin console with analytics, moderation, role management, and subscription management.
- Firebase Security Rules and Cloud Functions for backend trust.
- OpenAI-powered area summaries through a callable Cloud Function.
- English and Arabic localization.

## 6. Technology Stack

The mobile app is built with:

- React Native 0.81.5.
- React 19.1.0.
- TypeScript.
- React Navigation for auth and tab navigation.
- Firebase JavaScript SDK for Auth, Firestore, and Functions.
- React Native Maps for native map rendering.
- React Native Geolocation Service for device location.
- AsyncStorage for local language preference and auth persistence.
- React Native Web and Webpack for web-compatible builds.
- Leaflet and leaflet.heat for web map/heatmap support.
- ESLint and TypeScript type checking for static validation.

The backend uses:

- Firebase Cloud Functions.
- Firebase Admin SDK.
- Firestore.
- Firestore Security Rules.
- OpenAI API through the backend only.
- Firebase Emulator Suite for backend trust tests.

## 7. Active Project Structure

The active mobile implementation is under `mobile/`. The old Expo version is preserved under `legacy-expo/` but is not the active runtime.

Important mobile folders:

- `mobile/src/screens`: main screens for authentication, home, explore, post creation, profile, and web marketing.
- `mobile/src/components`: reusable UI components, explore panels, profile panels, auth visuals, and shared UI primitives.
- `mobile/src/context`: authentication and localization providers.
- `mobile/src/navigation`: native and web navigation structures.
- `mobile/src/services`: business logic, validation, discovery ranking, AI summary calls, location handling, profile management, subscriptions, moderation, analytics, comments, reactions, and notifications.
- `mobile/src/repositories`: Firestore and Firebase Functions access layer.
- `mobile/src/types`: TypeScript domain models.
- `mobile/src/theme`: shared design system, auth theme, navigation theme, and web desktop styling.
- `mobile/src/i18n`: translations, locale formatting, RTL helpers, and label formatting.

Supporting backend and verification files:

- `functions/index.js`: Cloud Functions for XP, notifications, promoted events, AI summaries, and leaderboard.
- `firestore.rules`: security rules for Firestore access control.
- `tests/backend-trust.test.cjs`: emulator-backed backend trust tests.

## 8. High-Level Architecture

The system follows a layered architecture:

1. UI Screens: Screens render user workflows such as login, home, explore, post creation, profile, and admin.
2. Components: Reusable cards, panels, buttons, chips, loading states, empty states, map/detail panels, and profile modules.
3. Context Providers: `AuthContext` tracks authentication state, and `LocalizationContext` controls language, RTL direction, formatting, and translations.
4. Services: Business rules and workflow validation live in service files. Examples include `postService`, `eventService`, `summaryService`, `subscriptionService`, and `profileService`.
5. Repositories: Repository files isolate direct Firebase access and map Firestore documents into typed app models.
6. Firebase Backend: Firestore stores app data, Firebase Auth provides identity, Cloud Functions perform trusted side effects, and Security Rules enforce access control.

This separation improves maintainability because screens do not directly own backend policy. They call services, services call repositories or Cloud Functions, and Firestore Rules plus Cloud Functions enforce trust boundaries.

## 9. Authentication and Account Setup

Authentication uses Firebase Auth email/password login and registration. The mobile app initializes Firebase Auth with AsyncStorage persistence on native platforms and browser persistence on web.

When a user registers, the app:

1. Creates the Firebase Auth account.
2. Waits for the authenticated session to be ready.
3. Creates a default user profile.
4. Creates or ensures a default subscription.

When a returning user signs in or an auth session is restored, the app ensures that the profile and subscription documents exist. This prevents the main app from loading with missing account metadata.

Default profile fields include:

- User id.
- Email.
- Role, initially `user`.
- XP, initially `0`.
- Badge keys.
- Username.
- Bio.
- Language, initially English.
- Privacy mode.
- Email notification preferences.
- Marketing email preference.

Supported roles are `user`, `organization`, and `admin`.

## 10. Localization and RTL Support

The app supports English and Arabic. Localization is handled through `LocalizationContext` and the `i18n` module. The context provides:

- Current language.
- RTL detection.
- Translation helper.
- Date and compact date formatting.
- Role, plan, and status labels.
- Text alignment helpers.
- Row direction helpers.
- Start/end inset helpers.

The profile screen allows users to change their language preference. The app also stores language preference in AsyncStorage and can sync it from the user profile if no local preference exists.

The navigation container receives RTL direction so the app can respond to Arabic layouts consistently.

## 11. Home Discovery Feed

The Home screen gives users a quick overview of what matters nearby. It subscribes to:

- Posts.
- Active promoted events.
- Favorite post ids.
- Notifications.
- Comment counts.
- Like counts.

It then builds discovery items using `buildDiscoverySpotItems` and `buildDiscoveryEventItems`. The feed includes sections such as:

- For You.
- Trending Nearby.
- Popular Events.
- Saved Spots Updates.

Discovery ranking uses multiple signals:

- Search relevance.
- Distance from the user when location is available.
- Freshness of posts and events.
- Engagement through comments and likes.
- Saved status.
- Nearby activity density.
- Promotion status for events.

The Home feed therefore acts as a summarized discovery surface, while Explore provides deeper map and search interaction.

## 12. Explore Map and Heatmap

The Explore screen is one of the main MVP features. It uses React Native Maps on native platforms and supports map pins, user location, selected cards, visible-region search, and heatmap-style activity.

The default Explore region is centered on Qatar. Users can filter by categories such as:

- All.
- Food and Drinks.
- Coffee.
- Study and Work.
- Outdoors.
- Fishing.
- Camping.
- Events.
- Family.
- Sights.

Search supports English and Arabic aliases. For example, Arabic terms for coffee, study, food, fishing, camping, outdoors, events, and sights map to relevant English aliases.

Explore combines posts and events into cards. Cards include title, subtitle, description, time, distance, image, signal labels, rating-like labels, saved state, and raw post/event data. The map displays:

- User location.
- Post pins.
- Event pins.
- Selected item focus.
- Heat points based on recent post and event activity.

The "Search this area" action refreshes visible results based on the current map region. Detail panels allow users to inspect posts and events, interact with posts, and report inappropriate content.

## 13. Local Post Creation

The Post screen allows signed-in users to publish local updates. A post contains:

- User id.
- Text.
- Internal backend category.
- Display category.
- Latitude and longitude.
- Optional place id.
- Optional hero image URL.
- Optional location name.
- Created timestamp.

Post validation includes:

- User must be logged in.
- Text cannot be empty.
- Text is limited to 280 characters.
- Optional media URL must use `http` or `https`.
- Location is required through either a selected location preset or current device/browser location.

The project includes Qatar location presets such as Qatar, Lusail, The Pearl, West Bay, Msheireb, Education City, and Aspire Zone. If no preset is selected, the app requests foreground location permission and captures current coordinates.

## 14. Promoted Event Creation

Promoted events are reserved for organization users. The mobile app checks role, subscription plan, plan status, and active event count before allowing event creation.

Supported plans are:

- `free`: 0 active promoted events.
- `organization_basic`: 1 active promoted event.
- `organization_premium`: 5 active promoted events.

Supported statuses are:

- `active`.
- `trial`.
- `inactive`.

Only organization accounts with an active or trial basic/premium plan can create promoted events. The mobile app performs user-facing validation, but the actual event creation is performed by the `createPromotedEvent` Cloud Function. This means the client cannot bypass the backend by writing directly to the `events` collection.

Promoted event fields include title, description, category, location, coordinates, start and end times, creator id, promotion flag, status, and timestamp.

## 15. Comments, Reactions, Saves, and Reports

Users can interact with posts through comments, likes, saved spots, and reports.

Comments:

- Require login.
- Cannot be empty.
- Are limited to 500 characters.
- Store user id, author label, text, and timestamp.
- Hidden comments are excluded from normal display.

Likes:

- Require login.
- Are stored as per-user reaction documents under each post.
- Can be toggled on and off.
- Support like count aggregation through collection group reads.

Saved spots:

- Stored under each user in a `favorites` subcollection.
- Used by Home and Profile to personalize saved updates.

Reports:

- Require login.
- Can target posts or comments.
- Support reasons: spam, misleading, offensive, unsafe, and other.
- Enter the moderation workflow with status `open`.

## 16. Profile, XP, and Leaderboard

The Profile screen is an account center. It shows:

- User identity and role.
- Subscription plan.
- XP.
- Saved count.
- Unread notification count.
- Saved spots.
- Recent activity.
- Account settings.
- Language setting.
- Privacy mode.
- Sign out.
- Leaderboard.
- Admin console when the user role is admin.

The leaderboard is loaded through a callable Cloud Function. It ranks users by XP and respects privacy mode by replacing private display names with a generic private user label.

XP rules are:

- Post created: 10 XP.
- Comment created: 4 XP.
- Like received: 2 XP.

The authoritative XP awards are handled by Cloud Functions and recorded with `xpEvents` so duplicate awards are avoided.

## 17. Admin Console and Moderation

Admin users see an Admin Console panel in the Profile screen. The admin console provides:

- Analytics summary.
- User count.
- Post count.
- Report count.
- Promoted event count.
- Comment count.
- Like count.
- Subscription and organization management.
- Report review actions.
- Hide action for reported posts or comments.

Admins can:

- Update a user's subscription plan and status.
- Mark a user as an organization account.
- Review reports.
- Dismiss reports.
- Hide reported posts or comments and mark the report as action taken.

Admin-only checks exist in both mobile services and Firestore Security Rules.

## 18. AI Area Summarization

AI area summaries are implemented as a backend-secured callable function named `summarizeArea`. The mobile app sends summarizable visible posts to the backend through `summaryService`.

The backend:

1. Requires authentication.
2. Validates that posts are provided.
3. Limits the prompt input to the first 20 valid posts.
4. Validates text length and category values.
5. Builds a concise OpenAI prompt.
6. Calls the OpenAI API from Cloud Functions.
7. Returns a 2-3 sentence summary.
8. Falls back to a local summary if OpenAI configuration, quota, or generation fails.

The OpenAI API key is not stored in the mobile app. It is read by the Cloud Function through environment variables or Firebase runtime config. This is important for security because the mobile client never directly calls OpenAI.

## 19. Backend Trust Model

The backend trust model is one of the strongest parts of the project. Firestore Security Rules and Cloud Functions divide responsibilities clearly.

Firestore Security Rules enforce:

- Users can read and update only their own profile fields.
- Users cannot change their own role, XP, or badges.
- Admins can update roles.
- Users can create their own posts, comments, likes, favorites, and reports.
- Users cannot create notifications directly.
- Users cannot create events directly.
- Users cannot write XP events.
- Admins can read reports and update report status.
- Admins can hide posts and comments through restricted moderation fields.
- Subscription updates require admin access.
- Event collection writes are denied from the client.

Cloud Functions own:

- XP awards for post creation, comment creation, and likes received.
- Notification creation for comments and likes.
- Promoted event creation with role, plan, status, and quota validation.
- AI area summaries.
- Leaderboard loading.

This trust model prevents users from granting themselves XP, creating fake notifications, bypassing promoted event quotas, or changing admin-only metadata from the client.

## 20. Data Model

Main Firestore collections and subcollections:

`users/{userId}`:

- Profile data, role, XP, badge keys, username, bio, language, privacy mode, notification settings, and timestamps.

`users/{userId}/favorites/{postId}`:

- Saved post references.

`users/{userId}/notifications/{notificationId}`:

- Comment and like notifications, read status, and timestamps.

`users/{userId}/subscriptions/current`:

- Plan level and plan status.

`users/{userId}/xpEvents/{eventId}`:

- XP event records used to prevent duplicate awards.

`posts/{postId}`:

- User-generated local updates with text, category, display category, location, optional image, and timestamp.

`posts/{postId}/comments/{commentId}`:

- Post comments with author, text, and hidden/moderation state.

`posts/{postId}/reactions/{userId}`:

- Like reactions.

`events/{eventId}`:

- Promoted event records created through Cloud Functions.

`reports/{reportId}`:

- Moderation reports with reporter, target, reason, note, status, and timestamp.

## 21. Privacy and Data Handling

Privacy is addressed in several ways:

- Users can switch profile privacy mode.
- Private leaderboard users are shown with a generic display name.
- Location is requested only when needed for current-area actions such as creating posts or events.
- The app stores coordinates for posts and events, not a continuous user location trail.
- The OpenAI API key remains server-side.
- Security Rules prevent unauthorized reads and writes to sensitive user subcollections.
- Notification creation and XP awards are server-owned.

## 22. User Interface and Design System

The UI uses a shared design system with warm neutral surfaces, a coral primary color, consistent typography, spacing, radius values, and shared components. The app includes:

- Custom auth screens with login/register forms.
- Bottom tab navigation on native platforms.
- Top navigation on web.
- Reusable cards, chips, metric tiles, sections, loading states, and empty states.
- Explore-specific components for cards, hero images, action rows, detail panels, and trust signal rows.
- Profile-specific components for account summaries, leaderboard, and admin tools.

The visual direction supports the presentation's claim that the app is polished enough for MVP evaluation, while still leaving room for future UI refinement after external usability testing.

## 23. Testing and Evaluation

Verification performed during this report:

- `npm run mobile:typecheck`: passed.
- `npm run mobile:lint`: passed.
- `npm run test:backend-trust`: passed with 10 tests, 10 passing, 0 failing.

Backend trust tests cover:

1. Users can edit their own profile but not another user's profile.
2. Collection group reads support Explore and analytics usage while protecting notifications from non-admin collection group reads.
3. Non-admin users cannot change roles or plans.
4. Users can create their own post, comment, like, and favorite.
5. Non-admin users cannot update report status or moderation flags.
6. Clients cannot directly create notifications or events.
7. Post creation awards post XP.
8. Comment creation awards comment XP and creates a notification.
9. Like creation awards like-received XP and creates a notification.
10. Promoted event creation enforces authentication, role, plan, and quota.

These tests support the presentation results around backend trust and security rules.

## 24. Results and Objective Attainment

The MVP satisfies the core project objectives:

- Local discovery is centralized through Home and Explore.
- Qatar-focused categories and location presets support local relevance.
- Users can publish geotagged posts.
- Users can comment, like, save, report, and receive notifications.
- Organizations can create promoted events only when backend rules allow it.
- AI area summaries are implemented through a secure backend path.
- XP and leaderboard features support gamification.
- Admin moderation and analytics are implemented.
- English and Arabic localization are implemented.
- TypeScript and lint checks pass.
- Backend trust tests pass.

The presentation claims 18 functional use cases, 4 actor types, 2 languages, and 10/10 backend trust tests. The current codebase supports those claims at the implementation level.

## 25. Limitations

The current project has several limitations:

1. No large external usability study has been completed.
2. Subscription payment processing is not integrated with a live payment gateway.
3. OpenAI calls are metered, so caching and cost controls would be needed at scale.
4. The app is configured around Qatar and would need broader localization and region support for expansion.
5. Android map rendering requires a valid Google Maps API key.
6. Live Cloud Functions deployment requires the Firebase project to be on the Blaze plan.
7. Full media upload is not yet implemented as a complete storage workflow; posts support image URLs, but not a complete in-app upload pipeline.
8. The backend tests focus on trust boundaries and do not replace full end-to-end mobile UI tests.
9. Web geolocation requires HTTPS outside localhost.
10. Explore and Profile are broad screens with many workflows, which may need simplification after user testing.

## 26. Future Work

Recommended future work:

1. Conduct an external usability study with real students, residents, visitors, and organizations.
2. Refine UI flows based on usability feedback.
3. Integrate a real payment gateway for organization subscriptions.
4. Add advanced admin analytics and exportable reports.
5. Add stronger AI personalization and recommendation ranking.
6. Add caching and rate limiting for AI summaries.
7. Add full media upload through Firebase Storage or another managed storage layer.
8. Expand beyond Qatar through multi-region data modeling and localization.
9. Add more automated UI and end-to-end tests.
10. Add production monitoring for Cloud Functions, Firestore usage, and AI costs.

## 27. Presentation Topic Alignment

The project report aligns with the presentation as follows:

- Slides 2-3: Problem and motivation are covered in Sections 2 and 3.
- Slides 4-7: Proposed solution features are covered in Sections 11, 12, 14, 18, and 16.
- Slide 8: Target users are covered in Section 4.
- Slide 9: MVP features are covered in Sections 5 and 11-18.
- Slide 10: High-level architecture is covered in Section 8.
- Slides 11-12: Database and backend design are covered in Sections 19 and 20.
- Slide 13: AI area summarization is covered in Section 18.
- Slide 14: Security, privacy, and moderation are covered in Sections 17, 19, and 21.
- Slides 15-18: Implementation screens are covered in Sections 11, 12, 16, and 17.
- Slide 19: Testing and evaluation are covered in Section 23.
- Slide 20: Results and objective attainment are covered in Section 24.
- Slide 21: Limitations are covered in Section 25.
- Slide 22: Future work is covered in Section 26.
- Slide 23: Conclusion is covered in Section 28.

## 28. Conclusion

Spots Mobile delivers a functional MVP for Qatar-focused local discovery. The application combines a mobile discovery feed, interactive map, local posting, promoted events, saved spots, comments, reactions, reports, notifications, gamification, profiles, admin tools, localization, and AI summaries. The architecture is especially strong because trust-sensitive features are not left to the client: Firestore Security Rules and Cloud Functions protect XP, notifications, event creation, role changes, subscription updates, moderation, leaderboard access, and AI API usage.

The project is suitable for a senior project final defense because it demonstrates frontend implementation, backend architecture, security design, real-time data handling, localization, AI integration, and testing. The remaining work is mostly about production readiness: payment integration, larger usability evaluation, scaling/cost controls, richer media handling, and broader geographic expansion.

