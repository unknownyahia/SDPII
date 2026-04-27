import type { AppLanguage } from '../types/profile';
import type { SpotCategory } from '../types/post';
import type { DisplayCategoryId, ExploreCategoryId } from '../constants/categories';
import {
  getDisplayCategoryIdForStoredCategory,
  isDisplayCategoryId,
} from '../constants/categories';

type TranslationParams = Record<string, string | number | null | undefined>;
type TranslationValue = string | ((params: TranslationParams) => string);

const translations: Record<AppLanguage, Record<string, TranslationValue>> = {
  en: {
    'common.retry': 'Retry',
    'common.dismiss': 'Dismiss',
    'common.cancel': 'Cancel',
    'common.unknown': 'Unknown',
    'common.unavailable': 'Unavailable',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.pendingTimestamp': 'Pending timestamp',
    'common.like': 'Like',
    'common.liked': 'Liked',
    'common.preparingWorkspace': 'Preparing your workspace...',
    'common.updated': 'Updated',
    'common.saved': 'Saved',
    'common.read': 'Read',
    'common.unread': 'Unread',
    'common.or': 'or',

    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.post': 'Post',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.register': 'Register',

    'auth.brand': 'Spots',
    'auth.login.eyebrow': 'Spots',
    'auth.login.title': "A calmer view of what's happening nearby.",
    'auth.login.subtitle':
      'Sign in to share live updates, explore map activity, and manage your profile.',
    'auth.login.cardTitle': 'Welcome back',
    'auth.login.cardSubtitle': 'Enter your email and password to continue.',
    'auth.login.emailLabel': 'Email',
    'auth.login.emailPlaceholder': 'name@example.com',
    'auth.login.passwordLabel': 'Password',
    'auth.login.passwordPlaceholder': 'Enter your password',
    'auth.login.submit': 'Sign In',
    'auth.login.secondary': 'Create New Account',
    'auth.register.eyebrow': 'New account',
    'auth.register.title': 'Create your Spots identity.',
    'auth.register.subtitle':
      'Set up a simple account to post updates, save favorites, and manage your settings.',
    'auth.register.cardTitle': 'Create account',
    'auth.register.cardSubtitle':
      'Your profile and default subscription will be created automatically.',
    'auth.register.passwordPlaceholder': 'Create a password',
    'auth.register.submit': 'Create Account',
    'auth.register.secondary': 'Back To Login',
    'auth.missingData': 'Missing data',

    'category.all': 'All',
    'category.food': 'Food & Drinks',
    'category.coffee': 'Coffee',
    'category.study': 'Study & Work',
    'category.outdoors': 'Outdoors',
    'category.fishing': 'Fishing',
    'category.camping': 'Camping',
    'category.events': 'Events',
    'category.family': 'Family',
    'category.sights': 'Sights',
    'category.event': 'Events',
    'category.sighting': 'Sights',
    'category.weather': 'Outdoors',
    'category.spot': 'Spot',

    'role.user': 'User',
    'role.admin': 'Admin',
    'role.organization': 'Organization',

    'plan.free': 'Free',
    'plan.organization_basic': 'Organization basic',
    'plan.organization_premium': 'Organization premium',
    'planStatus.active': 'Active',
    'planStatus.inactive': 'Inactive',
    'planStatus.trial': 'Trial',

    'home.title': 'Start with discovery',
    'home.subtitle':
      'Home keeps the calm overview. Explore is ready when you want full search and map depth.',
    'home.openExplore': 'Open Explore',
    'home.issueTitle': 'Live Home data is limited',
    'home.issueBody':
      'Some home feeds are unavailable right now.',
    'home.startHereEyebrow': 'Start here',
    'home.startHereTitle': 'Your local discovery overview',
    'home.startHereTitleUser': 'Welcome back, {name}',
    'home.startHereSubtitle':
      'A quick read on what matters nearby.',
    'home.heroLead':
      'Check the strongest shelves here, then open Explore when you want full search, filters, and map context.',
    'home.nextEventPulse': 'Next event pulse',
    'home.discoveryMode': 'Discovery mode',
    'home.noMajorEventsYet': 'No major events yet',
    'home.upcomingEvent': 'Upcoming event',
    'home.nearbyRankingActive': 'Nearby ranking is tuned to your location',
    'home.nearbyRankingBroad': 'Ranking stays broad until location is available',
    'home.saved': 'Saved',
    'home.unread': 'Unread',
    'home.liveNow': 'Live now',
    'home.locationActiveTitle': 'Nearby ranking is active',
    'home.locationOptionalTitle': 'Location is optional here',
    'home.locationActiveBody':
      'Nearby shelves are tuned to your location.',
    'home.locationOptionalBody':
      'Shelves stay broad until location is available.',
    'home.forYouEyebrow': 'For you',
    'home.forYouTitle': 'For You',
    'home.forYouSubtitle':
      'A mix of saved context and strong live activity.',
    'home.noRecommendationsTitle': 'No recommendations yet',
    'home.noRecommendationsSubtitle':
      'Explore and save a few places to start personalizing this shelf.',
    'home.weekendEyebrow': 'Weekend',
    'home.weekendTitle': 'This Weekend',
    'home.weekendSubtitle':
      'Upcoming event activity for the weekend window.',
    'home.noWeekendEventsTitle': 'No weekend events yet',
    'home.noWeekendEventsSubtitle':
      'When promoted events land in the weekend window, they will appear here.',
    'home.trendingEyebrow': 'Trending',
    'home.trendingTitle': 'Trending Nearby',
    'home.trendingSubtitle':
      'Strong current community activity nearby.',
    'home.noTrendsTitle': 'No nearby trends yet',
    'home.noTrendsSubtitle':
      'As fresh posts arrive, this shelf will fill with active spots.',
    'home.savedEyebrow': 'Saved',
    'home.savedTitle': 'Saved Spots Updates',
    'home.savedSubtitle':
      'Recent movement from places you already saved.',
    'home.noSavedTitle': 'No saved spots yet',
    'home.noSavedSubtitle':
      'Save places from Explore to build a living shortlist here.',
    'home.eventsEyebrow': 'Events',
    'home.eventsTitle': 'Popular Events',
    'home.eventsSubtitle':
      'Promoted events with the clearest live signals.',
    'home.noPopularEventsTitle': 'No promoted events yet',
    'home.noPopularEventsSubtitle':
      'Qualified event activity will start appearing here as events are published.',
    'home.personalizedEyebrow': 'Personalized',
    'home.personalizedTitle': 'Because You Saved...',
    'home.personalizedSubtitle':
      'More nearby places similar to what you save.',
    'home.unlockSavedTitle': 'Save a few spots to unlock this shelf',
    'home.unlockSavedSubtitle':
      'This section starts working once you bookmark places in Explore.',

    'post.title': 'Compose studio',
    'post.subtitle':
      'Local posting stays first. Event publishing remains available, but quieter and secondary.',
    'post.issueTitle': 'Publishing checks are limited',
    'post.issueBody':
      'Role, plan, or quota data could not be refreshed.',
    'post.localEyebrow': 'Local post',
    'post.localTitle': 'Share what is happening nearby',
    'post.localSubtitle':
      'Share a short local update. Location is captured when you publish.',
    'post.browserLocationTitle': 'Browser location is requested when you publish',
    'post.browserLocationBody':
      'On web, geolocation still needs HTTPS outside localhost.',
    'post.signInRequiredTitle': 'Sign-in required',
    'post.signInRequiredBody':
      'You need to be signed in before creating a location-based post.',
    'post.categoryLabel': 'Category',
    'post.textLabel': 'What are you seeing?',
    'post.textPlaceholder':
      'Describe conditions, crowds, weather, or what you found...',
    'post.charactersLeft': '{count} characters left',
    'post.capturePoint': 'Capture point',
    'post.capturePointPendingWeb':
      'Will be requested from your browser when you publish',
    'post.capturePointPendingNative':
      'Will be requested when you publish',
    'post.successTitle': 'Post published',
    'post.successBody':
      'Your most recent local update was created successfully.',
    'post.publishButton': 'Publish Local Update',
    'post.accessTitle': 'Publishing access',
    'post.accessSubtitle':
      'Role, plan, and quota stay visible while composing stays primary.',
    'post.roleMetric': 'Role',
    'post.planMetric': 'Plan',
    'post.eventQuotaMetric': 'Event quota',
    'post.eventAccessNeedsDataTitle': 'Publishing access needs backend data',
    'post.eventAccessNeedsDataBody':
      'Event publishing depends on role, plan, and quota data from the backend.',
    'post.eventAccessReadyTitle': 'Event studio is available',
    'post.eventAccessBlockedTitle': 'Event studio is restricted',
    'post.orgEyebrow': 'Organization event studio',
    'post.orgUnavailableTitle': 'Event access unavailable',
    'post.orgUnavailableSubtitle':
      "We could not confirm this account's event publishing access right now.",
    'post.orgTitle': 'Create a promoted event',
    'post.orgSubtitle':
      'Timing, access, and location stay visible while you compose.',
    'post.analyticsAccess': 'Analytics access',
    'post.analyticsAvailable': 'Premium analytics available',
    'post.analyticsUpgrade': 'Upgrade to organization premium',
    'post.planRestrictionTitle': 'Plan restriction',
    'post.eventAccessConfirmedTitle': 'Event access confirmed',
    'post.eventAccessConfirmedBody':
      'This account can create a promoted event right now.',
    'post.eventTitleLabel': 'Event title',
    'post.eventTitlePlaceholder':
      'Give people a clear reason to show up',
    'post.eventDescriptionLabel': 'Event description',
    'post.eventDescriptionPlaceholder':
      'Describe the event, what attendees should expect, and any important details',
    'post.eventCategoryLabel': 'Event category',
    'post.startTimeLabel': 'Start time',
    'post.endTimeLabel': 'End time',
    'post.startTimePlaceholderWeb': '2026-04-10T18:00',
    'post.endTimePlaceholderWeb': '2026-04-10T20:00',
    'post.timeHelperStart':
      'Uses your browser local time. Example: 2026-04-10T18:00',
    'post.timeHelperEnd':
      'Uses your browser local time. Example: 2026-04-10T20:00',
    'post.eventLocationLabel': 'Event location',
    'post.eventLocationPendingWeb':
      'Will be captured from your browser when the event is created',
    'post.eventLocationPendingNative':
      'Will be captured when the event is created',
    'post.eventSuccessTitle': 'Event published',
    'post.eventSuccessBody':
      'Your promoted event was created successfully.',
    'post.publishEventButton': 'Publish Promoted Event',
    'post.reservedTitle': 'Reserved for organization accounts',
    'post.reservedSubtitle':
      'Event publishing unlocks for eligible organization accounts.',
    'post.notEnabledTitle': 'Not enabled on this account',
    'post.notEnabledBody':
      'This studio opens automatically for organization users with the right plan.',
    'post.statusMetric': 'Status',
    'post.emptyPost': 'Empty post',
    'post.notLoggedIn': 'Not logged in',
    'post.createdAlertTitle': 'Post created',
    'post.createdAlertBody': 'Your activity update has been saved with GPS.',
    'post.locationPermissionTitle': 'Location permission denied',
    'post.createErrorTitle': 'Create post error',
    'post.eventCreatedAlertTitle': 'Event created',
    'post.eventCreatedAlertBody':
      'Your promoted event was saved successfully.',
    'post.eventValidationTitle': 'Event validation',
    'post.createEventErrorTitle': 'Create event error',

    'profile.title': 'Account center',
    'profile.subtitle':
      'Summary, saved places, activity, and settings live here first. Admin tools stay secondary.',
    'profile.issueTitle': 'Account data is limited',
    'profile.issueBody':
      'Some profile feeds are unavailable right now.',
    'profile.savedSpotsTitle': 'Saved Spots',
    'profile.savedSpotsSubtitle':
      'Your saved shortlist, kept easy to scan.',
    'profile.savedSpotsEmptyTitle': 'No saved spots yet',
    'profile.savedSpotsEmptySubtitle':
      'Save places from Explore to build your shortlist here.',
    'profile.activityTitle': 'Activity ({count} unread)',
    'profile.activitySubtitle':
      'Likes and comments that still need your attention.',
    'profile.activityWaitingTitle': 'New activity is waiting',
    'profile.activityWaitingBody':
      'Mark items as read once you review them.',
    'profile.activityCaughtUpTitle': 'You are caught up',
    'profile.activityCaughtUpBody':
      'New likes and comments will appear here.',
    'profile.noNotificationsTitle': 'No notifications yet',
    'profile.noNotificationsSubtitle':
      'You’ll see activity updates here once people start interacting.',
    'profile.commentActivity': 'Comment activity',
    'profile.likeActivity': 'Like activity',
    'profile.markAsRead': 'Mark as Read',
    'profile.updating': 'Updating...',
    'profile.settingsTitle': 'Settings',
    'profile.settingsSubtitle':
      'Identity, language, privacy, and core account controls.',
    'profile.planDetailsUnavailable': 'Plan details unavailable',
    'profile.planLabel': 'Plan: {plan}',
    'profile.planBody': 'Status: {status} · Email: {email}',
    'profile.usernameLabel': 'Username',
    'profile.usernamePlaceholder': 'Username',
    'profile.bioLabel': 'Bio',
    'profile.bioPlaceholder': 'Short bio',
    'profile.languageLabel': 'Language',
    'profile.languageEnglish': 'English',
    'profile.languageArabic': 'Arabic',
    'profile.privacyTitle': 'Privacy mode',
    'profile.privacyBody':
      'Reduce profile visibility for future social features.',
    'profile.unreadNotifications': 'Unread notifications',
    'profile.savedSpotsMetric': 'Saved spots',
    'profile.saveSettings': 'Save Settings',
    'profile.signOut': 'Sign Out',
    'profile.signingOut': 'Signing Out...',
    'profile.savedAlertTitle': 'Saved',
    'profile.savedAlertBody': 'Your profile settings were updated.',
    'profile.profileValidationTitle': 'Profile validation',
    'profile.saveErrorTitle': 'Save error',
    'profile.logoutErrorTitle': 'Logout error',
    'profile.notificationErrorTitle': 'Notification error',
    'profile.moderationErrorTitle': 'Moderation error',
    'profile.organizationUpdatedTitle': 'Updated',
    'profile.organizationUpdatedBody':
      'The account was marked as an organization.',
    'profile.organizationErrorTitle': 'Organization error',
    'profile.planUpdatedBody': 'The subscription plan was updated.',
    'profile.planErrorTitle': 'Plan error',
    'profile.analyticsErrorTitle': 'Analytics error',
    'profile.adminTitle': 'Admin operations',
    'profile.adminSubtitle':
      'Moderation, roles, plans, and analytics, kept separate from normal account tasks.',
    'profile.adminActiveTitle': 'Admin permissions are active',
    'profile.adminActiveBody':
      'Reports in queue: {count}. Use these tools only when operational action is needed.',
    'profile.accountsEyebrow': 'Accounts',
    'profile.accountsTitle': 'Organization accounts',
    'profile.accountsSubtitle':
      'Grant organization capabilities to a target account.',
    'profile.targetUserId': 'Target user id',
    'profile.targetUserPlaceholderOrganization':
      'User id to mark as organization',
    'profile.markOrganization': 'Mark User As Organization',
    'profile.plansEyebrow': 'Plans',
    'profile.plansTitle': 'Plan management',
    'profile.plansSubtitle':
      'Adjust plan access without leaving Profile.',
    'profile.targetUserPlaceholderPlan': 'User id to update plan',
    'profile.planLevel': 'Plan level',
    'profile.planStatus': 'Plan status',
    'profile.updateUserPlan': 'Update User Plan',
    'profile.analyticsEyebrow': 'Analytics',
    'profile.analyticsTitle': 'Operational metrics',
    'profile.analyticsSubtitle':
      'A quick operational snapshot across the platform.',
    'profile.refreshAnalytics': 'Refresh Analytics',
    'profile.refreshingAnalytics': 'Refreshing...',
    'profile.analyticsNoneTitle': 'No analytics loaded yet',
    'profile.analyticsNoneSubtitle':
      'Use refresh to request the latest admin snapshot.',
    'profile.analyticsUsers': 'Users',
    'profile.analyticsPosts': 'Posts',
    'profile.analyticsEvents': 'Events',
    'profile.analyticsReports': 'Reports',
    'profile.analyticsComments': 'Comments',
    'profile.analyticsLikes': 'Likes',
    'profile.analyticsAlerts': 'Alerts',
    'profile.analyticsOrganizations': 'Organizations',
    'profile.analyticsPostsByCategory': 'Posts by category',
    'profile.analyticsEventsByCategory': 'Events by category',
    'profile.analyticsReportsByStatus': 'Reports by status',
    'profile.moderationEyebrow': 'Moderation',
    'profile.moderationTitle': 'Reports queue',
    'profile.moderationSubtitle':
      'Review reports and take follow-up actions here.',
    'profile.noReportsTitle': 'No reports to review',
    'profile.noReportsSubtitle':
      'When users report posts or comments, they will show up here.',
    'profile.reportLabel': '{type} REPORT',
    'profile.reporter': 'Reporter: {reporter}',
    'profile.target': 'Target: {target} · Reason: {reason}',
    'profile.reportStatusLine': 'Status: {status}',
    'profile.reportNoteLine': 'Note: {note}',
    'profile.noNote': 'No note',
    'profile.hideReportedContent': 'Hide Reported Content',

    'account.eyebrow': 'Account center',
    'account.fallbackTitle': 'Your profile',
    'account.noEmail': 'No email available',
    'account.role': 'Role',
    'account.plan': 'Plan',
    'account.xp': 'XP',
    'account.saves': 'Saves',
    'account.unread': 'Unread',
    'account.planStatusUnavailable': 'Plan status unavailable',
    'account.planStatusLine': 'Plan {status} · {email}',

    'explore.headerTitle': 'Map-first local discovery',
    'explore.toolbarMeta':
      '{spots} spots · {events} events · {total} total updates',
    'explore.inViewLabel': 'In view',
    'explore.liveMapLabel': 'Live map view',
    'explore.issueTitle': 'Explore data is limited',
    'explore.issueBody':
      'The map is still available, but some live feeds or actions could not be refreshed.',
    'explore.summaryTitle': 'Area summary',
    'explore.summaryShort': 'Summary',
    'explore.summaryHint':
      'Area Summary turns the visible spot posts into a short local readout.',
    'explore.summaryError':
      'We could not generate an area summary right now.',
    'explore.quickPicksTitle': 'Quick picks',
    'explore.quickPicksSubtitle':
      'Browse a compact set of picks, or select a marker to focus the sheet.',
    'explore.selectedSpotTitle': 'Selected spot',
    'explore.selectedSpotSubtitle':
      'Trust, actions, and conversation stay inside this one sheet.',
    'explore.selectedEventTitle': 'Selected event',
    'explore.selectedEventSubtitle':
      'Timing, trust, and event details stay grouped here.',
    'explore.backToPicks': 'Back to picks',
    'explore.peekHint': 'Drag the handle for more',
    'explore.expand': 'Expand',
    'explore.collapse': 'Collapse',
    'explore.showMore': 'Show more',
    'explore.quickPicksCount': '{count} in view',
    'explore.noResultsTitle': 'No spots found',
    'explore.noResultsSubtitle':
      'Adjust your filters or create a new post to see activity appear here.',
    'explore.noSummary': 'No posts in this view to summarize.',
    'explore.topEventsTitle': 'Top events right now',
    'explore.topEventsSubtitle':
      'Promoted events ranked for the current map view.',
    'explore.topSpotsTitle': 'Top spots right now',
    'explore.topSpotsSubtitle':
      'Community spot updates ranked by trust, freshness, and nearby activity.',
    'explore.nearbySpotsTitle': 'Nearby spots',
    'explore.nearbySpotsSubtitle':
      'Community spot updates near the current event.',
    'explore.commentsTitle': 'Recent activity ({count})',
    'explore.commentsSubtitle':
      'Add context, react to the update, or review the ongoing conversation.',
    'explore.commentPlaceholder': 'Add a comment',
    'explore.commentHelperSignedIn':
      'Comments are posted immediately to the shared backend.',
    'explore.commentHelperSignedOut': 'Sign in to add a comment.',
    'explore.commentExpandHintSignedIn':
      'Expand this sheet to add a comment or review the conversation.',
    'explore.commentExpandHintSignedOut':
      'Expand this sheet to sign in and join the conversation.',
    'explore.addComment': 'Add Comment',
    'explore.noCommentsTitle': 'No comments yet',
    'explore.noCommentsSubtitle':
      'Start the conversation on this spot.',
    'explore.reportTitle': 'Report content',
    'explore.reportSubtitle':
      'Choose the reason that best fits and add an optional note.',
    'explore.reportNotePlaceholder': 'Optional note',
    'explore.submitReport': 'Submit Report',
    'explore.reportSubmittedTitle': 'Report submitted',
    'explore.reportSubmittedBody':
      'Thanks. Your report has been recorded.',
    'explore.favoriteErrorTitle': 'Favorite error',
    'explore.likeErrorTitle': 'Like error',
    'explore.commentErrorTitle': 'Comment error',
    'explore.deleteErrorTitle': 'Delete error',
    'explore.reportErrorTitle': 'Report error',
    'explore.delete': 'Delete',
    'explore.deleting': 'Deleting...',
    'explore.report': 'Report',
    'explore.signInForActionsTitle': 'Sign in for social actions',
    'explore.signInForActionsBody':
      'Likes, saved spots, comments, and reports require a signed-in account.',
    'explore.liveActionsLimitedTitle':
      'Live Explore actions may be incomplete',
    'explore.communitySpot': 'Community spot',
    'explore.liveEvent': 'Live event',
    'explore.promotedEvent': 'Promoted event',
    'explore.eventOverview': 'Event overview',
    'explore.eventDetails': 'Event details',
    'explore.spotSummaryTitle': "What's happening here",
    'explore.spotFactsTitle': 'Local context',
    'explore.searchPlaceholder': 'Search by spot, area, or activity',
    'explore.summaryButton': 'Area Summary',
    'explore.eventLocationUnknown': 'Venue unavailable',
    'explore.yourLocation': 'Your location',
    'explore.locationDeniedTitle': 'Browser location was not granted',
    'explore.locationDeniedBody':
      'Explore still works without it, but nearby ranking needs browser location access.',
    'explore.locationEnabledTitle': 'Location enabled',
    'explore.locationEnabledBody':
      'Results now prioritize nearby spots and events.',
    'explore.locationUnavailableTitle': 'Browser location is unavailable',
    'explore.locationUnavailableBody':
      'Unable to read your browser location right now.',
    'explore.locationChecking': 'Checking...',
    'explore.locationRefresh': 'Refresh',
    'explore.locationButton': 'Location',
    'explore.locationStatusActive': 'Nearby ranking on',
    'explore.locationStatusUnavailable': 'Location unavailable',
    'explore.resultsMissing': 'Some results may be missing.',
    'explore.resultsLabel': 'Results',
    'explore.resultsCount': '{count} results',
    'explore.selectResult': 'Select a result',
    'explore.savedToFavoritesTitle': 'Saved to favorites',
    'explore.savedToFavoritesBody':
      'This post now appears in your saved favorites list.',
    'explore.removedFromFavoritesTitle': 'Removed from favorites',
    'explore.removedFromFavoritesBody':
      'This post is no longer in your saved favorites list.',
    'explore.favoriteFailedBody': 'Failed to update your favorites.',
    'explore.likedTitle': 'Post liked',
    'explore.likedBody': 'Your like was saved on this post.',
    'explore.unlikedTitle': 'Like removed',
    'explore.unlikedBody': 'Your like was removed from this post.',
    'explore.likeFailedBody': 'Failed to update this like.',
    'explore.commentPostedTitle': 'Comment posted',
    'explore.commentPostedBody': 'Your comment was added to this spot.',
    'explore.commentFailedBody': 'Failed to add this comment.',
    'explore.commentDeletedTitle': 'Comment deleted',
    'explore.commentDeletedBody': 'Your comment was removed from this post.',
    'explore.deleteFailedBody': 'Failed to delete this comment.',
    'explore.reportFailedBody': 'Failed to submit this report.',
    'explore.mapNearby': 'Nearby',
    'explore.mapArea': 'Area',
    'explore.placesLabel': 'Places',
    'explore.eventsLabel': 'Events',
    'explore.youLabel': 'You',

    'reportReason.spam': 'Spam',
    'reportReason.misleading': 'Misleading',
    'reportReason.offensive': 'Offensive',
    'reportReason.unsafe': 'Unsafe',
    'reportReason.other': 'Other',
    'reportStatus.open': 'Open',
    'reportStatus.reviewed': 'Reviewed',
    'reportStatus.dismissed': 'Dismissed',
    'reportStatus.action_taken': 'Action taken',

    'discovery.distanceUnavailable': 'Distance unavailable',
    'discovery.metersAway': '{value} m away',
    'discovery.kmAway': '{value} km away',
    'discovery.pendingUpdate': 'Pending update',
    'discovery.minutesAgo': '{value} min ago',
    'discovery.hoursAgo': '{value} hr ago',
    'discovery.daysAgo': '{value} day{suffix} ago',
    'discovery.spotFallback': '{category} spot',
    'discovery.areaFallback': 'Area {lat}, {lng}',
    'discovery.locationFact': 'Location',
    'discovery.updatedFact': 'Updated',
    'discovery.distanceFact': 'Distance',
    'discovery.venueFact': 'Venue',
    'discovery.startsFact': 'Starts',
    'discovery.endsFact': 'Ends',
    'discovery.organizerFact': 'Organizer',
    'discovery.unknownOrganizer': 'Unknown',
    'discovery.popularNow': 'Popular now',
    'discovery.updatedSignal': 'Updated {value}',
    'discovery.recentPostsSignal': 'Based on {count} recent posts',
    'discovery.communitySignal': 'Recent local update',
    'discovery.comments': '{count} comment{suffix}',
    'discovery.likes': '{count} like{suffix}',
    'discovery.saved': 'Saved',
    'discovery.nearbyUpdates': '{count} nearby updates',
    'discovery.activeNow': 'Active now',
    'discovery.promoted': 'Promoted',
    'discovery.startingSoon': 'Starting soon',
    'discovery.nearbyPostsSignal': 'Based on {count} nearby posts',
    'discovery.scheduled': 'Scheduled',
    'discovery.nearbyPosts': '{count} nearby post{suffix}',
  },
  ar: {
    'common.retry': 'إعادة المحاولة',
    'common.dismiss': 'إخفاء',
    'common.cancel': 'إلغاء',
    'common.unknown': 'غير معروف',
    'common.unavailable': 'غير متاح',
    'common.save': 'حفظ',
    'common.loading': 'جارٍ التحميل...',
    'common.pendingTimestamp': 'الوقت لم يصل بعد',
    'common.like': 'إعجاب',
    'common.liked': 'تم الإعجاب',
    'common.preparingWorkspace': 'جارٍ تجهيز مساحتك...',
    'common.updated': 'محدّث',
    'common.saved': 'محفوظ',
    'common.read': 'مقروء',
    'common.unread': 'غير مقروء',
    'common.or': 'أو',

    'nav.home': 'الرئيسية',
    'nav.explore': 'الاستكشاف',
    'nav.post': 'نشر',
    'nav.profile': 'الحساب',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',

    'auth.brand': 'سبوتس',
    'auth.login.eyebrow': 'سبوتس',
    'auth.login.title': 'نظرة أهدأ لما يحدث من حولك.',
    'auth.login.subtitle':
      'سجّل الدخول لمشاركة التحديثات الحية واستكشاف نشاط الخريطة وإدارة ملفك الشخصي.',
    'auth.login.cardTitle': 'مرحبًا بعودتك',
    'auth.login.cardSubtitle': 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.',
    'auth.login.emailLabel': 'البريد الإلكتروني',
    'auth.login.emailPlaceholder': 'name@example.com',
    'auth.login.passwordLabel': 'كلمة المرور',
    'auth.login.passwordPlaceholder': 'أدخل كلمة المرور',
    'auth.login.submit': 'تسجيل الدخول',
    'auth.login.secondary': 'إنشاء حساب جديد',
    'auth.register.eyebrow': 'حساب جديد',
    'auth.register.title': 'أنشئ هويتك في سبوتس.',
    'auth.register.subtitle':
      'أنشئ حسابًا بسيطًا لمشاركة التحديثات وحفظ الأماكن المفضلة وإدارة الإعدادات.',
    'auth.register.cardTitle': 'إنشاء حساب',
    'auth.register.cardSubtitle':
      'سيتم إنشاء ملفك الشخصي والاشتراك الافتراضي تلقائيًا.',
    'auth.register.passwordPlaceholder': 'أنشئ كلمة مرور',
    'auth.register.submit': 'إنشاء الحساب',
    'auth.register.secondary': 'العودة لتسجيل الدخول',
    'auth.missingData': 'بيانات ناقصة',

    'category.all': 'الكل',
    'category.food': 'مأكولات ومشروبات',
    'category.coffee': 'قهوة',
    'category.study': 'دراسة وعمل',
    'category.outdoors': 'خارجي',
    'category.fishing': 'الصيد',
    'category.camping': 'التخييم',
    'category.events': 'فعاليات',
    'category.family': 'عائلة',
    'category.sights': 'معالم',
    'category.event': 'فعاليات',
    'category.sighting': 'معالم',
    'category.weather': 'خارجي',
    'category.spot': 'مكان',

    'role.user': 'مستخدم',
    'role.admin': 'مشرف',
    'role.organization': 'جهة',

    'plan.free': 'مجاني',
    'plan.organization_basic': 'جهة أساسي',
    'plan.organization_premium': 'جهة مميز',
    'planStatus.active': 'نشط',
    'planStatus.inactive': 'غير نشط',
    'planStatus.trial': 'تجريبي',

    'home.title': 'ابدأ بالاستكشاف',
    'home.subtitle':
      'تبقيك الرئيسية في ملخص هادئ، ويكون الاستكشاف جاهزًا عندما تريد البحث والخريطة بعمق.',
    'home.openExplore': 'افتح الاستكشاف',
    'home.issueTitle': 'بيانات الرئيسية محدودة',
    'home.issueBody':
      'بعض خلاصات الرئيسية غير متاحة الآن.',
    'home.startHereEyebrow': 'ابدأ من هنا',
    'home.startHereTitle': 'نظرة محلية سريعة',
    'home.startHereTitleUser': 'مرحبًا بعودتك، {name}',
    'home.startHereSubtitle':
      'قراءة سريعة لما يهم بالقرب منك.',
    'home.heroLead':
      'ابدأ بأقوى الرفوف هنا، ثم افتح الاستكشاف عندما تريد البحث الكامل والفلاتر وسياق الخريطة.',
    'home.nextEventPulse': 'نبض الفعالية القادمة',
    'home.discoveryMode': 'وضع الاكتشاف',
    'home.noMajorEventsYet': 'لا توجد فعاليات بارزة بعد',
    'home.upcomingEvent': 'فعالية قادمة',
    'home.nearbyRankingActive': 'الترتيب القريب مضبوط على موقعك',
    'home.nearbyRankingBroad': 'يبقى الترتيب عامًا حتى يتوفر الموقع',
    'home.saved': 'المحفوظ',
    'home.unread': 'غير المقروء',
    'home.liveNow': 'الآن',
    'home.locationActiveTitle': 'الترتيب القريب مفعل',
    'home.locationOptionalTitle': 'الموقع اختياري هنا',
    'home.locationActiveBody':
      'يتم ضبط الرفوف القريبة وفق موقعك.',
    'home.locationOptionalBody':
      'تبقى الرفوف عامة حتى يتوفر الموقع.',
    'home.forYouEyebrow': 'لك',
    'home.forYouTitle': 'لك',
    'home.forYouSubtitle':
      'مزيج من المحفوظات وأقوى النشاط الحي.',
    'home.noRecommendationsTitle': 'لا توجد ترشيحات بعد',
    'home.noRecommendationsSubtitle':
      'استكشف واحفظ بعض الأماكن لبدء تخصيص هذا الرف.',
    'home.weekendEyebrow': 'عطلة نهاية الأسبوع',
    'home.weekendTitle': 'هذا الأسبوع',
    'home.weekendSubtitle':
      'نشاط الفعاليات القادم ضمن نافذة عطلة نهاية الأسبوع.',
    'home.noWeekendEventsTitle': 'لا توجد فعاليات لهذا الأسبوع بعد',
    'home.noWeekendEventsSubtitle':
      'عندما تصل فعاليات مروجة ضمن نافذة نهاية الأسبوع ستظهر هنا.',
    'home.trendingEyebrow': 'الأكثر نشاطًا',
    'home.trendingTitle': 'الأبرز بالقرب منك',
    'home.trendingSubtitle':
      'أقوى نشاط مجتمعي حالي بالقرب منك.',
    'home.noTrendsTitle': 'لا توجد اتجاهات قريبة بعد',
    'home.noTrendsSubtitle':
      'مع وصول منشورات جديدة سيمتلئ هذا الرف بالأماكن النشطة.',
    'home.savedEyebrow': 'المحفوظ',
    'home.savedTitle': 'تحديثات الأماكن المحفوظة',
    'home.savedSubtitle':
      'آخر الحركة من الأماكن التي حفظتها بالفعل.',
    'home.noSavedTitle': 'لا توجد أماكن محفوظة بعد',
    'home.noSavedSubtitle':
      'احفظ أماكن من الاستكشاف لبناء قائمة حية هنا.',
    'home.eventsEyebrow': 'الفعاليات',
    'home.eventsTitle': 'الفعاليات الشائعة',
    'home.eventsSubtitle':
      'فعاليات مروجة بأوضح الإشارات الحية.',
    'home.noPopularEventsTitle': 'لا توجد فعاليات مروجة بعد',
    'home.noPopularEventsSubtitle':
      'ستبدأ الفعاليات المؤهلة بالظهور هنا عند نشرها.',
    'home.personalizedEyebrow': 'مخصص',
    'home.personalizedTitle': 'لأنك حفظت...',
    'home.personalizedSubtitle':
      'أماكن قريبة إضافية تشبه ما تحفظه.',
    'home.unlockSavedTitle': 'احفظ بعض الأماكن لتفعيل هذا الرف',
    'home.unlockSavedSubtitle':
      'يبدأ هذا القسم بالعمل عندما تحفظ أماكن من الاستكشاف.',

    'post.title': 'مساحة النشر',
    'post.subtitle':
      'يبقى النشر المحلي أولًا هنا، بينما يظل نشر الفعاليات متاحًا لكن أكثر هدوءًا وثانوية.',
    'post.issueTitle': 'فحوصات النشر محدودة',
    'post.issueBody':
      'تعذر تحديث بيانات الدور أو الخطة أو الحصة.',
    'post.localEyebrow': 'منشور محلي',
    'post.localTitle': 'شارك ما يحدث بالقرب منك',
    'post.localSubtitle':
      'شارك تحديثًا محليًا قصيرًا. سيتم التقاط الموقع عند النشر.',
    'post.browserLocationTitle': 'سيتم طلب موقع المتصفح عند النشر',
    'post.browserLocationBody':
      'على الويب ما زال تحديد الموقع يحتاج HTTPS خارج localhost.',
    'post.signInRequiredTitle': 'مطلوب تسجيل الدخول',
    'post.signInRequiredBody':
      'يجب تسجيل الدخول قبل إنشاء منشور يعتمد على الموقع.',
    'post.categoryLabel': 'الفئة',
    'post.textLabel': 'ماذا ترى؟',
    'post.textPlaceholder':
      'صف الظروف أو الازدحام أو الطقس أو ما وجدته...',
    'post.charactersLeft': 'المتبقي {count} حرف',
    'post.capturePoint': 'نقطة الالتقاط',
    'post.capturePointPendingWeb': 'سيُطلب من المتصفح عند النشر',
    'post.capturePointPendingNative': 'سيُطلب عند النشر',
    'post.successTitle': 'تم نشر المنشور',
    'post.successBody': 'تم إنشاء أحدث تحديث محلي بنجاح.',
    'post.publishButton': 'نشر التحديث المحلي',
    'post.accessTitle': 'صلاحية النشر',
    'post.accessSubtitle':
      'تبقى بيانات الدور والخطة والحصة ظاهرة بينما يبقى التأليف هو الأساس.',
    'post.roleMetric': 'الدور',
    'post.planMetric': 'الخطة',
    'post.eventQuotaMetric': 'حصة الفعاليات',
    'post.eventAccessNeedsDataTitle': 'صلاحية النشر تحتاج بيانات خلفية',
    'post.eventAccessNeedsDataBody':
      'يعتمد نشر الفعاليات على بيانات الدور والخطة والحصة من الخلفية.',
    'post.eventAccessReadyTitle': 'استوديو الفعاليات متاح',
    'post.eventAccessBlockedTitle': 'استوديو الفعاليات مقيّد',
    'post.orgEyebrow': 'استوديو فعاليات الجهات',
    'post.orgUnavailableTitle': 'وصول الفعالية غير متاح',
    'post.orgUnavailableSubtitle':
      'تعذر تأكيد صلاحية هذا الحساب لنشر الفعاليات الآن.',
    'post.orgTitle': 'أنشئ فعالية مروجة',
    'post.orgSubtitle':
      'يبقى الوقت والصلاحية والموقع واضحًا أثناء التأليف.',
    'post.analyticsAccess': 'وصول التحليلات',
    'post.analyticsAvailable': 'تحليلات مميزة متاحة',
    'post.analyticsUpgrade': 'قم بالترقية إلى الجهة المميزة',
    'post.planRestrictionTitle': 'قيد الخطة',
    'post.eventAccessConfirmedTitle': 'تم تأكيد صلاحية الفعالية',
    'post.eventAccessConfirmedBody':
      'يمكن لهذا الحساب إنشاء فعالية مروجة الآن.',
    'post.eventTitleLabel': 'عنوان الفعالية',
    'post.eventTitlePlaceholder': 'قدّم سببًا واضحًا للحضور',
    'post.eventDescriptionLabel': 'وصف الفعالية',
    'post.eventDescriptionPlaceholder':
      'اشرح الفعالية وما الذي يتوقعه الحضور وأي تفاصيل مهمة',
    'post.eventCategoryLabel': 'فئة الفعالية',
    'post.startTimeLabel': 'وقت البداية',
    'post.endTimeLabel': 'وقت النهاية',
    'post.startTimePlaceholderWeb': '2026-04-10T18:00',
    'post.endTimePlaceholderWeb': '2026-04-10T20:00',
    'post.timeHelperStart':
      'يستخدم التوقيت المحلي للمتصفح. مثال: 2026-04-10T18:00',
    'post.timeHelperEnd':
      'يستخدم التوقيت المحلي للمتصفح. مثال: 2026-04-10T20:00',
    'post.eventLocationLabel': 'موقع الفعالية',
    'post.eventLocationPendingWeb':
      'سيتم التقاطه من المتصفح عند إنشاء الفعالية',
    'post.eventLocationPendingNative':
      'سيتم التقاطه عند إنشاء الفعالية',
    'post.eventSuccessTitle': 'تم نشر الفعالية',
    'post.eventSuccessBody': 'تم إنشاء الفعالية المروجة بنجاح.',
    'post.publishEventButton': 'نشر الفعالية المروجة',
    'post.reservedTitle': 'مخصص لحسابات الجهات',
    'post.reservedSubtitle':
      'يتم فتح نشر الفعاليات لحسابات الجهات المؤهلة.',
    'post.notEnabledTitle': 'غير مفعّل لهذا الحساب',
    'post.notEnabledBody':
      'يفتح هذا الاستوديو تلقائيًا لمستخدمي الجهات ذوي الخطة المناسبة.',
    'post.statusMetric': 'الحالة',
    'post.emptyPost': 'المنشور فارغ',
    'post.notLoggedIn': 'غير مسجّل الدخول',
    'post.createdAlertTitle': 'تم إنشاء المنشور',
    'post.createdAlertBody': 'تم حفظ تحديث النشاط مع إحداثيات GPS.',
    'post.locationPermissionTitle': 'تم رفض إذن الموقع',
    'post.createErrorTitle': 'خطأ في إنشاء المنشور',
    'post.eventCreatedAlertTitle': 'تم إنشاء الفعالية',
    'post.eventCreatedAlertBody': 'تم حفظ الفعالية المروجة بنجاح.',
    'post.eventValidationTitle': 'التحقق من الفعالية',
    'post.createEventErrorTitle': 'خطأ في إنشاء الفعالية',

    'profile.title': 'مركز الحساب',
    'profile.subtitle':
      'يبدأ هنا الملخص والمحفوظات والنشاط والإعدادات، بينما تبقى أدوات المشرف ثانوية.',
    'profile.issueTitle': 'بيانات الحساب محدودة',
    'profile.issueBody':
      'بعض خلاصات الحساب غير متاحة الآن.',
    'profile.savedSpotsTitle': 'الأماكن المحفوظة',
    'profile.savedSpotsSubtitle':
      'قائمتك المحفوظة، بشكل أوضح وأسهل للمسح.',
    'profile.savedSpotsEmptyTitle': 'لا توجد أماكن محفوظة بعد',
    'profile.savedSpotsEmptySubtitle':
      'احفظ أماكن من الاستكشاف لبناء قائمتك هنا.',
    'profile.activityTitle': 'النشاط ({count} غير مقروء)',
    'profile.activitySubtitle':
      'الإعجابات والتعليقات التي ما زالت تحتاج انتباهك.',
    'profile.activityWaitingTitle': 'هناك نشاط جديد بانتظارك',
    'profile.activityWaitingBody':
      'علّم العناصر كمقروءة بعد مراجعتها.',
    'profile.activityCaughtUpTitle': 'أنت مطّلع على كل شيء',
    'profile.activityCaughtUpBody':
      'ستظهر الإعجابات والتعليقات الجديدة هنا.',
    'profile.noNotificationsTitle': 'لا توجد إشعارات بعد',
    'profile.noNotificationsSubtitle':
      'سترى تحديثات النشاط هنا عندما يبدأ الآخرون بالتفاعل.',
    'profile.commentActivity': 'نشاط التعليقات',
    'profile.likeActivity': 'نشاط الإعجابات',
    'profile.markAsRead': 'تعليم كمقروء',
    'profile.updating': 'جارٍ التحديث...',
    'profile.settingsTitle': 'الإعدادات',
    'profile.settingsSubtitle':
      'الهوية واللغة والخصوصية وعناصر التحكم الأساسية بالحساب.',
    'profile.planDetailsUnavailable': 'تفاصيل الخطة غير متاحة',
    'profile.planLabel': 'الخطة: {plan}',
    'profile.planBody': 'الحالة: {status} · البريد: {email}',
    'profile.usernameLabel': 'اسم المستخدم',
    'profile.usernamePlaceholder': 'اسم المستخدم',
    'profile.bioLabel': 'النبذة',
    'profile.bioPlaceholder': 'نبذة قصيرة',
    'profile.languageLabel': 'اللغة',
    'profile.languageEnglish': 'الإنجليزية',
    'profile.languageArabic': 'العربية',
    'profile.privacyTitle': 'وضع الخصوصية',
    'profile.privacyBody':
      'يقلل من ظهور الملف الشخصي لميزات اجتماعية مستقبلية.',
    'profile.unreadNotifications': 'الإشعارات غير المقروءة',
    'profile.savedSpotsMetric': 'الأماكن المحفوظة',
    'profile.saveSettings': 'حفظ الإعدادات',
    'profile.signOut': 'تسجيل الخروج',
    'profile.signingOut': 'جارٍ تسجيل الخروج...',
    'profile.savedAlertTitle': 'تم الحفظ',
    'profile.savedAlertBody': 'تم تحديث إعدادات ملفك الشخصي.',
    'profile.profileValidationTitle': 'التحقق من الملف الشخصي',
    'profile.saveErrorTitle': 'خطأ في الحفظ',
    'profile.logoutErrorTitle': 'خطأ في تسجيل الخروج',
    'profile.notificationErrorTitle': 'خطأ في الإشعار',
    'profile.moderationErrorTitle': 'خطأ في الإشراف',
    'profile.organizationUpdatedTitle': 'تم التحديث',
    'profile.organizationUpdatedBody': 'تمت ترقية الحساب إلى جهة.',
    'profile.organizationErrorTitle': 'خطأ في حساب الجهة',
    'profile.planUpdatedBody': 'تم تحديث خطة الاشتراك.',
    'profile.planErrorTitle': 'خطأ في الخطة',
    'profile.analyticsErrorTitle': 'خطأ في التحليلات',
    'profile.adminTitle': 'عمليات المشرف',
    'profile.adminSubtitle':
      'الإشراف والأدوار والخطط والتحليلات، لكنها تبقى منفصلة عن مهام الحساب العادية.',
    'profile.adminActiveTitle': 'صلاحيات المشرف مفعلة',
    'profile.adminActiveBody':
      'عدد البلاغات في الطابور: {count}. استخدم هذه الأدوات عند الحاجة التشغيلية فقط.',
    'profile.accountsEyebrow': 'الحسابات',
    'profile.accountsTitle': 'حسابات الجهات',
    'profile.accountsSubtitle':
      'امنح قدرات الجهة لحساب مستهدف.',
    'profile.targetUserId': 'معرّف المستخدم المستهدف',
    'profile.targetUserPlaceholderOrganization':
      'معرّف المستخدم لتحويله إلى جهة',
    'profile.markOrganization': 'تحويل المستخدم إلى جهة',
    'profile.plansEyebrow': 'الخطط',
    'profile.plansTitle': 'إدارة الخطط',
    'profile.plansSubtitle':
      'عدّل صلاحية الخطة دون مغادرة الملف الشخصي.',
    'profile.targetUserPlaceholderPlan': 'معرّف المستخدم لتحديث الخطة',
    'profile.planLevel': 'مستوى الخطة',
    'profile.planStatus': 'حالة الخطة',
    'profile.updateUserPlan': 'تحديث خطة المستخدم',
    'profile.analyticsEyebrow': 'التحليلات',
    'profile.analyticsTitle': 'مؤشرات تشغيلية',
    'profile.analyticsSubtitle':
      'لقطة تشغيلية سريعة عبر المنصة.',
    'profile.refreshAnalytics': 'تحديث التحليلات',
    'profile.refreshingAnalytics': 'جارٍ التحديث...',
    'profile.analyticsNoneTitle': 'لا توجد تحليلات محمّلة بعد',
    'profile.analyticsNoneSubtitle':
      'استخدم التحديث لطلب أحدث لقطة إدارية.',
    'profile.analyticsUsers': 'المستخدمون',
    'profile.analyticsPosts': 'المنشورات',
    'profile.analyticsEvents': 'الفعاليات',
    'profile.analyticsReports': 'البلاغات',
    'profile.analyticsComments': 'التعليقات',
    'profile.analyticsLikes': 'الإعجابات',
    'profile.analyticsAlerts': 'التنبيهات',
    'profile.analyticsOrganizations': 'الجهات',
    'profile.analyticsPostsByCategory': 'المنشورات حسب الفئة',
    'profile.analyticsEventsByCategory': 'الفعاليات حسب الفئة',
    'profile.analyticsReportsByStatus': 'البلاغات حسب الحالة',
    'profile.moderationEyebrow': 'الإشراف',
    'profile.moderationTitle': 'طابور البلاغات',
    'profile.moderationSubtitle':
      'راجع البلاغات واتخذ الإجراءات اللازمة هنا.',
    'profile.noReportsTitle': 'لا توجد بلاغات للمراجعة',
    'profile.noReportsSubtitle':
      'عندما يبلغ المستخدمون عن منشورات أو تعليقات ستظهر هنا.',
    'profile.reportLabel': 'بلاغ {type}',
    'profile.reporter': 'المبلّغ: {reporter}',
    'profile.target': 'الهدف: {target} · السبب: {reason}',
    'profile.reportStatusLine': 'الحالة: {status}',
    'profile.reportNoteLine': 'الملاحظة: {note}',
    'profile.noNote': 'لا توجد ملاحظة',
    'profile.hideReportedContent': 'إخفاء المحتوى المبلّغ عنه',

    'account.eyebrow': 'مركز الحساب',
    'account.fallbackTitle': 'ملفك الشخصي',
    'account.noEmail': 'لا يوجد بريد إلكتروني',
    'account.role': 'الدور',
    'account.plan': 'الخطة',
    'account.xp': 'النقاط',
    'account.saves': 'المحفوظات',
    'account.unread': 'غير المقروء',
    'account.planStatusUnavailable': 'حالة الخطة غير متاحة',
    'account.planStatusLine': 'الخطة {status} · {email}',

    'explore.headerTitle': 'استكشاف محلي يعتمد على الخريطة',
    'explore.toolbarMeta':
      '{spots} أماكن · {events} فعاليات · {total} تحديثات إجمالًا',
    'explore.inViewLabel': 'في العرض',
    'explore.liveMapLabel': 'عرض خريطة حي',
    'explore.issueTitle': 'بيانات الاستكشاف محدودة',
    'explore.issueBody':
      'ما زالت الخريطة متاحة، لكن بعض الخلاصات أو الإجراءات الحية لم يتم تحديثها.',
    'explore.summaryTitle': 'ملخص المنطقة',
    'explore.summaryShort': 'ملخص',
    'explore.summaryHint':
      'يحوّل ملخص المنطقة منشورات الأماكن الظاهرة إلى قراءة محلية قصيرة.',
    'explore.summaryError':
      'تعذّر إنشاء ملخص المنطقة الآن.',
    'explore.quickPicksTitle': 'الاختيارات السريعة',
    'explore.quickPicksSubtitle':
      'تصفح مجموعة صغيرة من الاختيارات أو اختر علامة على الخريطة لتركيز اللوحة.',
    'explore.selectedSpotTitle': 'المكان المحدد',
    'explore.selectedSpotSubtitle':
      'الثقة والإجراءات والمحادثة تبقى كلها داخل هذه اللوحة الواحدة.',
    'explore.selectedEventTitle': 'الفعالية المحددة',
    'explore.selectedEventSubtitle':
      'يبقى الوقت والثقة وتفاصيل الفعالية مجمعة هنا.',
    'explore.backToPicks': 'العودة للاختيارات',
    'explore.peekHint': 'اسحب المقبض لمزيد من التفاصيل',
    'explore.expand': 'توسيع',
    'explore.collapse': 'تصغير',
    'explore.showMore': 'المزيد',
    'explore.quickPicksCount': '{count} في العرض',
    'explore.noResultsTitle': 'لم يتم العثور على أماكن',
    'explore.noResultsSubtitle':
      'عدّل الفلاتر أو أنشئ منشورًا جديدًا لرؤية النشاط هنا.',
    'explore.noSummary': 'لا توجد منشورات في هذا العرض لتلخيصها.',
    'explore.topEventsTitle': 'أبرز الفعاليات الآن',
    'explore.topEventsSubtitle':
      'فعاليات مروجة مرتبة وفق عرض الخريطة الحالي.',
    'explore.topSpotsTitle': 'أبرز الأماكن الآن',
    'explore.topSpotsSubtitle':
      'تحديثات المجتمع مرتبة حسب الثقة والحداثة والنشاط القريب.',
    'explore.nearbySpotsTitle': 'أماكن قريبة',
    'explore.nearbySpotsSubtitle':
      'تحديثات مجتمعية قريبة من الفعالية الحالية.',
    'explore.commentsTitle': 'النشاط الأخير ({count})',
    'explore.commentsSubtitle':
      'أضف سياقًا أو تفاعل مع التحديث أو راجع المحادثة الجارية.',
    'explore.commentPlaceholder': 'أضف تعليقًا',
    'explore.commentHelperSignedIn':
      'يتم نشر التعليقات مباشرة في الخلفية المشتركة.',
    'explore.commentHelperSignedOut': 'سجّل الدخول لإضافة تعليق.',
    'explore.commentExpandHintSignedIn':
      'وسّع هذه اللوحة لإضافة تعليق أو مراجعة المحادثة.',
    'explore.commentExpandHintSignedOut':
      'وسّع هذه اللوحة لتسجيل الدخول والانضمام إلى المحادثة.',
    'explore.addComment': 'إضافة تعليق',
    'explore.noCommentsTitle': 'لا توجد تعليقات بعد',
    'explore.noCommentsSubtitle': 'ابدأ المحادثة حول هذا المكان.',
    'explore.reportTitle': 'الإبلاغ عن محتوى',
    'explore.reportSubtitle':
      'اختر السبب الأنسب وأضف ملاحظة اختيارية.',
    'explore.reportNotePlaceholder': 'ملاحظة اختيارية',
    'explore.submitReport': 'إرسال البلاغ',
    'explore.reportSubmittedTitle': 'تم إرسال البلاغ',
    'explore.reportSubmittedBody':
      'شكرًا لك. تم تسجيل البلاغ.',
    'explore.favoriteErrorTitle': 'خطأ في الحفظ',
    'explore.likeErrorTitle': 'خطأ في الإعجاب',
    'explore.commentErrorTitle': 'خطأ في التعليق',
    'explore.deleteErrorTitle': 'خطأ في الحذف',
    'explore.reportErrorTitle': 'خطأ في البلاغ',
    'explore.delete': 'حذف',
    'explore.deleting': 'جارٍ الحذف...',
    'explore.report': 'إبلاغ',
    'explore.signInForActionsTitle': 'سجّل الدخول للإجراءات الاجتماعية',
    'explore.signInForActionsBody':
      'الإعجابات والحفظ والتعليقات والبلاغات تحتاج إلى حساب مسجل الدخول.',
    'explore.liveActionsLimitedTitle':
      'قد تكون إجراءات الاستكشاف الحية غير مكتملة',
    'explore.communitySpot': 'مكان مجتمعي',
    'explore.liveEvent': 'فعالية حية',
    'explore.promotedEvent': 'فعالية مروجة',
    'explore.eventOverview': 'نظرة على الفعالية',
    'explore.eventDetails': 'تفاصيل الفعالية',
    'explore.spotSummaryTitle': 'ما الذي يحدث هنا',
    'explore.spotFactsTitle': 'السياق المحلي',
    'explore.searchPlaceholder': 'ابحث حسب المكان أو المنطقة أو النشاط',
    'explore.summaryButton': 'ملخص المنطقة',
    'explore.eventLocationUnknown': 'المكان غير متاح',
    'explore.yourLocation': 'موقعك',
    'explore.locationDeniedTitle': 'لم يتم منح موقع المتصفح',
    'explore.locationDeniedBody':
      'لا يزال الاستكشاف يعمل، لكن ترتيب النتائج القريبة يحتاج إذن موقع المتصفح.',
    'explore.locationEnabledTitle': 'تم تفعيل الموقع',
    'explore.locationEnabledBody':
      'أصبحت النتائج تركز الآن على الأماكن والفعاليات القريبة.',
    'explore.locationUnavailableTitle': 'موقع المتصفح غير متاح',
    'explore.locationUnavailableBody':
      'تعذر قراءة موقع المتصفح الآن.',
    'explore.locationChecking': 'جارٍ التحقق...',
    'explore.locationRefresh': 'تحديث',
    'explore.locationButton': 'الموقع',
    'explore.locationStatusActive': 'الترتيب القريب مفعّل',
    'explore.locationStatusUnavailable': 'الموقع غير متاح',
    'explore.resultsMissing': 'قد تكون بعض النتائج مفقودة.',
    'explore.resultsLabel': 'النتائج',
    'explore.resultsCount': '{count} نتيجة',
    'explore.selectResult': 'اختر نتيجة',
    'explore.savedToFavoritesTitle': 'تم الحفظ في المفضلة',
    'explore.savedToFavoritesBody':
      'يظهر هذا المنشور الآن في قائمة المفضلة المحفوظة لديك.',
    'explore.removedFromFavoritesTitle': 'تمت إزالته من المفضلة',
    'explore.removedFromFavoritesBody':
      'لم يعد هذا المنشور موجودًا في قائمة المفضلة المحفوظة لديك.',
    'explore.favoriteFailedBody': 'تعذر تحديث المفضلة.',
    'explore.likedTitle': 'تم الإعجاب بالمنشور',
    'explore.likedBody': 'تم حفظ إعجابك على هذا المنشور.',
    'explore.unlikedTitle': 'تمت إزالة الإعجاب',
    'explore.unlikedBody': 'تمت إزالة إعجابك من هذا المنشور.',
    'explore.likeFailedBody': 'تعذر تحديث هذا الإعجاب.',
    'explore.commentPostedTitle': 'تم نشر التعليق',
    'explore.commentPostedBody': 'تمت إضافة تعليقك إلى هذا المكان.',
    'explore.commentFailedBody': 'تعذر إضافة هذا التعليق.',
    'explore.commentDeletedTitle': 'تم حذف التعليق',
    'explore.commentDeletedBody': 'تمت إزالة تعليقك من هذا المنشور.',
    'explore.deleteFailedBody': 'تعذر حذف هذا التعليق.',
    'explore.reportFailedBody': 'تعذر إرسال هذا البلاغ.',
    'explore.mapNearby': 'قريب',
    'explore.mapArea': 'المنطقة',
    'explore.placesLabel': 'الأماكن',
    'explore.eventsLabel': 'الفعاليات',
    'explore.youLabel': 'أنت',

    'reportReason.spam': 'رسائل مزعجة',
    'reportReason.misleading': 'مضلل',
    'reportReason.offensive': 'مسيء',
    'reportReason.unsafe': 'غير آمن',
    'reportReason.other': 'أخرى',
    'reportStatus.open': 'مفتوح',
    'reportStatus.reviewed': 'تمت مراجعته',
    'reportStatus.dismissed': 'مرفوض',
    'reportStatus.action_taken': 'تم اتخاذ إجراء',

    'discovery.distanceUnavailable': 'المسافة غير متاحة',
    'discovery.metersAway': 'يبعد {value} متر',
    'discovery.kmAway': 'يبعد {value} كم',
    'discovery.pendingUpdate': 'التحديث قيد الانتظار',
    'discovery.minutesAgo': 'قبل {value} دقيقة',
    'discovery.hoursAgo': 'قبل {value} ساعة',
    'discovery.daysAgo': 'قبل {value} يوم',
    'discovery.spotFallback': 'مكان {category}',
    'discovery.areaFallback': 'منطقة {lat}، {lng}',
    'discovery.locationFact': 'الموقع',
    'discovery.updatedFact': 'آخر تحديث',
    'discovery.distanceFact': 'المسافة',
    'discovery.venueFact': 'المكان',
    'discovery.startsFact': 'تبدأ',
    'discovery.endsFact': 'تنتهي',
    'discovery.organizerFact': 'الجهة المنظمة',
    'discovery.unknownOrganizer': 'غير معروف',
    'discovery.popularNow': 'شائع الآن',
    'discovery.updatedSignal': 'محدّث {value}',
    'discovery.recentPostsSignal': 'استنادًا إلى {count} منشورات حديثة',
    'discovery.communitySignal': 'تحديث محلي حديث',
    'discovery.comments': '{count} تعليق',
    'discovery.likes': '{count} إعجاب',
    'discovery.saved': 'محفوظ',
    'discovery.nearbyUpdates': '{count} تحديثات قريبة',
    'discovery.activeNow': 'نشط الآن',
    'discovery.promoted': 'مروّج',
    'discovery.startingSoon': 'يبدأ قريبًا',
    'discovery.nearbyPostsSignal': 'استنادًا إلى {count} منشورات قريبة',
    'discovery.scheduled': 'مجدول',
    'discovery.nearbyPosts': '{count} منشورات قريبة',
  },
};

let currentLanguage: AppLanguage = 'en';

function interpolate(template: string, params: TranslationParams) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

function resolveEntry(
  value: TranslationValue | undefined,
  params: TranslationParams
) {
  if (typeof value === 'function') {
    return value(params);
  }

  if (typeof value === 'string') {
    return interpolate(value, params);
  }

  return '';
}

export function setCurrentLanguage(language: AppLanguage) {
  currentLanguage = language;
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function isRTL(language = currentLanguage) {
  return language === 'ar';
}

export function getLocale(language = currentLanguage) {
  return language === 'ar' ? 'ar-QA' : 'en-US';
}

export function translate(
  key: string,
  params: TranslationParams = {},
  language = currentLanguage
) {
  const languageEntries = translations[language];
  const fallbackEntries = translations.en;

  return (
    resolveEntry(languageEntries[key], params) ||
    resolveEntry(fallbackEntries[key], params) ||
    key
  );
}

export function formatNumber(value: number, language = currentLanguage) {
  return new Intl.NumberFormat(getLocale(language)).format(value);
}

export function formatDateTime(value: Date | number | string, language = currentLanguage) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString(getLocale(language));
}

export function formatCompactDateTime(
  value: Date | number | string,
  language = currentLanguage
) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function getTextAlign(language = currentLanguage) {
  return isRTL(language) ? 'right' : 'left';
}

export function getOppositeTextAlign(language = currentLanguage) {
  return isRTL(language) ? 'left' : 'right';
}

export function getRowDirection(language = currentLanguage) {
  return isRTL(language) ? 'row-reverse' : 'row';
}

export function getStartEdgeInsets(
  start: number,
  end: number,
  language = currentLanguage
) {
  return isRTL(language)
    ? { left: end, right: start }
    : { left: start, right: end };
}

export function getCategoryLabel(
  category?: SpotCategory,
  language = currentLanguage,
  displayCategory?: DisplayCategoryId | null
) {
  if (isDisplayCategoryId(displayCategory)) {
    return translate(`category.${displayCategory}`, {}, language);
  }

  const storedDisplayCategory = getDisplayCategoryIdForStoredCategory(category);

  if (!storedDisplayCategory) {
    return translate('category.spot', {}, language);
  }

  return translate(`category.${storedDisplayCategory}`, {}, language);
}

export function getExploreCategoryLabel(
  category: ExploreCategoryId,
  language = currentLanguage
) {
  return translate(`category.${category}`, {}, language);
}

export function getRoleLabel(role?: string | null, language = currentLanguage) {
  if (!role) {
    return translate('common.unknown', {}, language);
  }

  return translate(`role.${role}`, {}, language);
}

export function getPlanLevelLabel(plan?: string | null, language = currentLanguage) {
  if (!plan) {
    return translate('plan.free', {}, language);
  }

  return translate(`plan.${plan}`, {}, language);
}

export function getPlanStatusLabel(
  status?: string | null,
  language = currentLanguage
) {
  if (!status) {
    return translate('common.unavailable', {}, language);
  }

  return translate(`planStatus.${status}`, {}, language);
}

export function getReportReasonLabel(reason?: string | null, language = currentLanguage) {
  if (!reason) {
    return translate('common.unknown', {}, language);
  }

  return translate(`reportReason.${reason}`, {}, language);
}

export function getReportStatusLabel(status?: string | null, language = currentLanguage) {
  if (!status) {
    return translate('common.unavailable', {}, language);
  }

  return translate(`reportStatus.${status}`, {}, language);
}

export function getPluralSuffix(count: number) {
  return count === 1 ? '' : 's';
}
