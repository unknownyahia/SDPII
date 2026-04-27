import React from 'react';
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronRight,
  Coffee,
  Fish,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  PencilLine,
  Search,
  ShieldCheck,
  Tent,
  Trees,
  User,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import type { ExploreCategoryId } from '../../constants/categories';
import type { ExploreRouteParams } from '../../navigation/types';

type LandingChip = {
  label: string;
  icon: LucideIcon | null;
  chipId: ExploreCategoryId;
};

type LandingCardCategories = readonly ExploreCategoryId[];

type SpotsLandingPageProps = {
  isAuthenticated: boolean;
  onCreatePost: () => void;
  onExplore: (params?: ExploreRouteParams) => void;
  onProfile: () => void;
  onRegister: () => void;
  onSignIn: () => void;
};

const chips: LandingChip[] = [
  { label: 'All', icon: null, chipId: 'all' },
  { label: 'Food & Drinks', icon: Utensils, chipId: 'food' },
  { label: 'Coffee', icon: Coffee, chipId: 'coffee' },
  { label: 'Study & Work', icon: BookOpen, chipId: 'study' },
  { label: 'Outdoors', icon: Trees, chipId: 'outdoors' },
  { label: 'Fishing', icon: Fish, chipId: 'fishing' },
  { label: 'Camping', icon: Tent, chipId: 'camping' },
  { label: 'Events', icon: CalendarDays, chipId: 'events' },
  { label: 'Family', icon: Users, chipId: 'family' },
  { label: 'Sights', icon: Camera, chipId: 'sights' },
];

const landingImages = {
  dohaCorniche:
    'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=1800&q=80',
  kataraVillage:
    'https://images.unsplash.com/photo-1647755370020-c2926b10b96a?auto=format&fit=crop&w=1200&q=80',
  kataraMinaret:
    'https://images.unsplash.com/photo-1757923926688-b4757cf76f71?auto=format&fit=crop&w=1200&q=80',
  pearlWaterfront:
    'https://images.unsplash.com/photo-1728488447537-d0ef1b9018e3?auto=format&fit=crop&w=1200&q=80',
  pearlHarbor:
    'https://images.unsplash.com/photo-1694505519057-faefe6c350a8?auto=format&fit=crop&w=1200&q=80',
  aspirePark:
    'https://images.unsplash.com/photo-1645614145206-7852de5b4b21?auto=format&fit=crop&w=1200&q=80',
  msheirebDowntown:
    'https://images.unsplash.com/photo-1646205028104-32d922c45cc0?auto=format&fit=crop&w=1200&q=80',
  lusailCrescent:
    'https://images.unsplash.com/photo-1700901742651-6b353164caf3?auto=format&fit=crop&w=1200&q=80',
  qatarCoast:
    'https://images.unsplash.com/photo-1646211059552-9a61fc7ef457?auto=format&fit=crop&w=1200&q=80',
  alKhorCoast:
    'https://images.unsplash.com/photo-1625729410412-2294315b517b?auto=format&fit=crop&w=1200&q=80',
  qatarFood:
    'https://images.unsplash.com/photo-1741125528766-45a3963cbbc0?auto=format&fit=crop&w=1200&q=80',
  coffee:
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  study:
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  dessert:
    'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=600&q=80',
  eventCrowd:
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  avatar:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
} as const;

const featuredCards = [
  {
    title: 'Katara Cultural Village',
    area: 'Cultural District',
    meta: '4.6 (620) • Cultural Center',
    badge: 'Top Pick',
    badgeColor: 'red',
    image: landingImages.kataraMinaret,
    categories: ['sights', 'family', 'events'] as LandingCardCategories,
  },
  {
    title: 'The Pearl-Qatar',
    area: 'The Pearl',
    meta: '4.7 (1.1K) • Waterfront',
    badge: 'Popular',
    badgeColor: 'orange',
    image: landingImages.pearlWaterfront,
    categories: ['food', 'outdoors', 'sights'] as LandingCardCategories,
  },
  {
    title: 'Aspire Zone',
    area: 'Al Waab',
    meta: '4.5 (812) • Park & Sports',
    badge: '',
    badgeColor: 'slate',
    image: landingImages.aspirePark,
    categories: ['outdoors', 'family', 'study'] as LandingCardCategories,
  },
  {
    title: 'Msheireb Downtown',
    area: 'Msheireb',
    meta: '4.6 (540) • Heritage Area',
    badge: '',
    badgeColor: 'slate',
    image: landingImages.msheirebDowntown,
    categories: ['food', 'coffee', 'study', 'sights'] as LandingCardCategories,
  },
  {
    title: 'Lusail Marina',
    area: 'Lusail',
    meta: '4.6 (302) • Marina',
    badge: 'New',
    badgeColor: 'rose',
    image: landingImages.lusailCrescent,
    categories: ['food', 'outdoors', 'sights'] as LandingCardCategories,
  },
  {
    title: 'Al Khor Fishing Spot',
    area: 'Al Khor',
    meta: '4.4 (198) • Fishing Spot',
    badge: 'Outdoor',
    badgeColor: 'emerald',
    image: landingImages.alKhorCoast,
    categories: ['fishing', 'camping', 'outdoors'] as LandingCardCategories,
  },
  {
    title: 'Qatar Weekend Festival',
    area: 'Katara',
    meta: 'May 24 – May 26 • Festival',
    badge: 'Event',
    badgeColor: 'blue',
    image: landingImages.eventCrowd,
    categories: ['events', 'family', 'food'] as LandingCardCategories,
  },
];

const listCards = [
  {
    title: 'Sahara Walk Coffee Quiet Desk Hours',
    subtitle: 'Al Sadd • Café',
    meta: '4.7 (94) • 3.4 km away',
    image: landingImages.coffee,
    categories: ['coffee', 'study', 'food'] as LandingCardCategories,
  },
  {
    title: 'West Bay Evening Promenade',
    subtitle: 'West Bay • Waterfront',
    meta: '4.5 (73) • 8.3 km away',
    image: landingImages.dohaCorniche,
    categories: ['outdoors', 'sights', 'family'] as LandingCardCategories,
  },
];

const events = [
  {
    day: '24',
    month: 'APR',
    title: 'Katara Family Lawn After Dinner Loop',
    area: 'Katara Cultural Village',
    when: 'Today • 10:10 PM',
    image: landingImages.kataraVillage,
    categories: ['events', 'family', 'outdoors'] as LandingCardCategories,
  },
  {
    day: '25',
    month: 'APR',
    title: 'Lusail Boulevard Bites',
    area: 'Lusail Boulevard',
    when: 'Tomorrow • 6:00 PM',
    image: landingImages.qatarFood,
    categories: ['events', 'food', 'family'] as LandingCardCategories,
  },
];

const updates = [
  {
    title: '21 High Street Dessert Bar',
    desc: 'New photos added',
    time: '1 min ago',
    image: landingImages.dessert,
    categories: ['food'] as LandingCardCategories,
  },
  {
    title: 'Minaretein Study Lounge',
    desc: 'Conditions updated',
    time: '1 min ago',
    image: landingImages.study,
    categories: ['study', 'coffee'] as LandingCardCategories,
  },
];

const postPreviewImages = [
  'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1646211059552-9a61fc7ef457?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1645614145206-7852de5b4b21?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1694505519057-faefe6c350a8?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1741125528766-45a3963cbbc0?auto=format&fit=crop&w=400&q=80',
];

const miniChips = ['All', 'Food & Drinks', 'Coffee', 'Outdoors', 'Events', 'More'] as const;

const miniChipCategoryMap: Record<(typeof miniChips)[number], ExploreCategoryId> = {
  All: 'all',
  'Food & Drinks': 'food',
  Coffee: 'coffee',
  Outdoors: 'outdoors',
  Events: 'events',
  More: 'sights',
};

const previewListItems = [
  'Katara Cultural Village',
  'The Pearl-Qatar',
  'Aspire Zone',
  'Msheireb Downtown',
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function SectionCard({
  id,
  title,
  action,
  children,
  onAction,
}: {
  id?: string;
  title: string;
  action?: string;
  children: React.ReactNode;
  onAction?: () => void;
}) {
  return (
    <div id={id} className="spots-section-card">
      <div className="spots-section-card-header">
        <h3>{title}</h3>
        {action ? (
          <button type="button" onClick={onAction} className="spots-link-button">
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToAbout() {
  scrollToSection('spots-about');
}

export function SpotsLandingPage({
  isAuthenticated,
  onCreatePost,
  onExplore,
  onProfile,
  onRegister,
  onSignIn,
}: SpotsLandingPageProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedChipId, setSelectedChipId] = React.useState<ExploreCategoryId>('all');
  const [selectedMiniChip, setSelectedMiniChip] =
    React.useState<(typeof miniChips)[number]>('All');
  const [selectedPreviewItem, setSelectedPreviewItem] = React.useState(previewListItems[0]);
  const [selectedMarketingCard, setSelectedMarketingCard] = React.useState('');
  const [selectedGuideStep, setSelectedGuideStep] = React.useState('explore');
  const [isComposerPrimed, setIsComposerPrimed] = React.useState(false);

  const submitSearch = React.useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const query = searchQuery.trim();
      if (!query) {
        return;
      }

      onExplore({
        focusSearch: true,
        query,
      });
    },
    [onExplore, searchQuery]
  );

  const selectLandingChip = React.useCallback((chipId: ExploreCategoryId) => {
    setSelectedChipId(chipId);

    if (chipId === 'events') {
      scrollToSection('spots-events');
      return;
    }

    if (chipId === 'coffee' || chipId === 'study') {
      scrollToSection('spots-trending');
      return;
    }

    scrollToSection('spots-featured');
  }, []);

  const selectMiniChip = React.useCallback((chip: (typeof miniChips)[number]) => {
    setSelectedMiniChip(chip);
    setSelectedChipId(miniChipCategoryMap[chip]);
  }, []);

  const selectMarketingCard = React.useCallback((title: string) => {
    setSelectedMarketingCard(title);
  }, []);

  const selectGuideStep = React.useCallback((step: string) => {
    setSelectedGuideStep(step);
  }, []);

  const categoryMatches = React.useCallback(
    (categories: LandingCardCategories) =>
      selectedChipId !== 'all' && categories.includes(selectedChipId),
    [selectedChipId]
  );

  return (
    <div className="spots-page">
      <div className="spots-outer">
        <div className="spots-browser">
          <div className="spots-browser-bar">
            <div className="spots-window-dots" aria-hidden="true">
              <span className="spots-dot-red" />
              <span className="spots-dot-yellow" />
              <span className="spots-dot-green" />
            </div>
            <button
              type="button"
              className="spots-address-bar"
              onClick={scrollToTop}
            >
              spots.qa
            </button>
            <div className="spots-browser-spacer" />
          </div>

          <header className="spots-header">
            <div className="spots-header-row">
              <button
                type="button"
                className="spots-brand"
                onClick={scrollToTop}
              >
                <span className="spots-brand-icon">
                  <MapPin size={24} />
                </span>
                <span>Spots</span>
              </button>

              <nav className="spots-nav" aria-label="Primary">
                <button type="button" onClick={() => onExplore()}>
                  Explore
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChipId('events');
                    scrollToSection('spots-events');
                  }}
                >
                  Events
                </button>
                <button type="button" onClick={() => scrollToSection('spots-community')}>
                  Community
                </button>
                <button type="button" onClick={scrollToAbout}>
                  About
                </button>
              </nav>

              <div className="spots-header-actions">
                <form className="spots-search" onSubmit={submitSearch}>
                  <Search size={20} className="spots-muted-icon" />
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.currentTarget.value)}
                    aria-label="Search places, events, or areas in Qatar"
                    placeholder="Search places, events, or areas in Qatar"
                  />
                  <div className="spots-search-divider" />
                  <button
                    type="button"
                    className="spots-near-button"
                    onClick={() => setSearchQuery('Near me')}
                  >
                    <MapPin size={16} />
                    Near me
                  </button>
                </form>

                {isAuthenticated ? (
                  <button type="button" className="spots-ghost-button" onClick={onProfile}>
                    Account
                  </button>
                ) : (
                  <>
                    <button type="button" className="spots-ghost-button" onClick={onSignIn}>
                      Sign In
                    </button>
                    <button type="button" className="spots-ghost-button" onClick={onRegister}>
                      Register
                    </button>
                  </>
                )}
                <button type="button" className="spots-primary-button" onClick={onCreatePost}>
                  Create Post
                </button>
              </div>
            </div>
          </header>

          <main className="spots-main">
            <section className="spots-hero">
              <div className="spots-hero-copy">
                <h1>
                  Discover the
                  <br />
                  best spots in Qatar
                </h1>
                <p>
                  Find top cafés, study places, family spots, fishing locations,
                  outdoor escapes, events and local updates — all in one place.
                </p>

                <div className="spots-hero-actions">
                  <button type="button" className="spots-hero-primary" onClick={() => onExplore()}>
                    Explore Spots
                    <ChevronRight size={20} />
                  </button>
                  <button type="button" className="spots-hero-secondary" onClick={onCreatePost}>
                    <PencilLine size={20} />
                    Create a Post
                  </button>
                </div>

                <div className="spots-trust-grid">
                  <div className="spots-trust-item">
                    <Users size={24} />
                    <div>
                      <strong>Active Local Community</strong>
                      <span>45K+ locals sharing tips</span>
                    </div>
                  </div>
                  <div className="spots-trust-item">
                    <ShieldCheck size={24} />
                    <div>
                      <strong>Trusted & Verified</strong>
                      <span>Verified organizers and quality spots</span>
                    </div>
                  </div>
                  <div className="spots-trust-item">
                    <Flame size={24} />
                    <div>
                      <strong>Fresh & Relevant</strong>
                      <span>Real-time updates from the community</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="spots-hero-preview">
                <div className="spots-hero-bg">
                  <img
                    src={landingImages.dohaCorniche}
                    alt="Doha skyline"
                  />
                  <div />
                </div>

                <div className="spots-preview-grid">
                  <div className="spots-map-panel">
                    <div className="spots-map-panel-head">
                      <div className="spots-mini-brand">
                        <MapPin size={20} /> Spots
                      </div>
                      <button
                        type="button"
                        className={cx(
                          'spots-mini-pill',
                          searchQuery.toLowerCase() === 'near me' && 'active'
                        )}
                        aria-pressed={searchQuery.toLowerCase() === 'near me'}
                        onClick={() => setSearchQuery('Near me')}
                      >
                        Near me
                      </button>
                    </div>
                    <div className="spots-mini-chips">
                      {miniChips.map(chip => (
                        <button
                          key={chip}
                          type="button"
                          className={selectedMiniChip === chip ? 'active' : ''}
                          aria-pressed={selectedMiniChip === chip}
                          onClick={() => selectMiniChip(chip)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <div className="spots-map-content-grid">
                      <div className="spots-preview-list">
                        {previewListItems.map((item, index) => (
                          <button
                            key={item}
                            type="button"
                            className={cx(
                              'spots-preview-list-card',
                              selectedPreviewItem === item && 'active'
                            )}
                            aria-pressed={selectedPreviewItem === item}
                            onClick={() => {
                              setSelectedPreviewItem(item);
                              selectMarketingCard(item);
                            }}
                          >
                            <img src={featuredCards[index].image} alt={item} />
                            <span>
                              <strong>{item}</strong>
                              <small>4.{6 + index} • Great local pick</small>
                              <em>Views, dining, parks or culture</em>
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={cx(
                          'spots-map-image',
                          selectedPreviewItem === 'Map preview' && 'active'
                        )}
                        aria-label="Preview the Qatar map"
                        aria-pressed={selectedPreviewItem === 'Map preview'}
                        onClick={() => setSelectedPreviewItem('Map preview')}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80"
                          alt="Map preview"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="spots-side-panels">
                    <div className="spots-create-panel">
                      <div className="spots-create-head">
                        <strong>Create Post</strong>
                        <span aria-hidden="true">×</span>
                      </div>
                      <button
                        type="button"
                        className="spots-user-row"
                        onClick={() => setIsComposerPrimed(true)}
                      >
                        <img
                          src={landingImages.avatar}
                          alt="You"
                        />
                        <span>
                          <strong>You</strong>
                          <small>Public</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={cx('spots-post-placeholder', isComposerPrimed && 'active')}
                        aria-pressed={isComposerPrimed}
                        onClick={() => setIsComposerPrimed(true)}
                      >
                        Share a great spot, update or event...
                      </button>
                      <div className="spots-photo-grid">
                        {postPreviewImages.map((src, index) => (
                          <img key={src} src={src} alt={`Post preview ${index + 1}`} />
                        ))}
                      </div>
                      <button type="button" className="spots-post-button" onClick={onCreatePost}>
                        Post
                      </button>
                    </div>

                    <button
                      type="button"
                      className={cx(
                        'spots-profile-panel',
                        selectedGuideStep === 'manage' && 'active'
                      )}
                      aria-pressed={selectedGuideStep === 'manage'}
                      onClick={() => selectGuideStep('manage')}
                    >
                      <div className="spots-profile-head">
                        <img
                          src={landingImages.avatar}
                          alt="Ali"
                        />
                        <span>
                          <strong>Ali Al-Thani</strong>
                          <small>@ali_qtr</small>
                          <em>Local Guide</em>
                        </span>
                      </div>
                      <div className="spots-profile-stats">
                        {[
                          ['128', 'Posts'],
                          ['342', 'Followers'],
                          ['215', 'Following'],
                        ].map(([number, label]) => (
                          <span key={label}>
                            <strong>{number}</strong>
                            <small>{label}</small>
                          </span>
                        ))}
                      </div>
                      <div className="spots-profile-menu">
                        {['My Posts', 'Saved Spots', 'My Events', 'Following', 'Settings'].map(
                          item => (
                            <span key={item}>
                              {item}
                              <ChevronRight size={16} />
                            </span>
                          )
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="spots-chip-section">
              <div className="spots-chip-row">
                {chips.map(chip => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      className={selectedChipId === chip.chipId ? 'active' : ''}
                      aria-pressed={selectedChipId === chip.chipId}
                      onClick={() => selectLandingChip(chip.chipId)}
                    >
                      {Icon ? <Icon size={16} /> : null}
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <div className="spots-happening">
                <strong>What’s happening in Qatar?</strong>
                <span>
                  <Flame size={16} className="spots-red-icon" /> 1,250+ new reviews this week
                </span>
                <span>
                  <MessageCircle size={16} className="spots-green-icon" /> 320+ community posts today
                </span>
                <span>
                  <CalendarDays size={16} className="spots-red-icon" /> 48 events happening this weekend
                </span>
                <span className="spots-happening-last">
                  <span>
                    <ShieldCheck size={16} className="spots-amber-icon" /> Verified organizers & quality places
                  </span>
                  <button type="button" onClick={() => scrollToSection('spots-updates')}>
                    See all updates
                  </button>
                </span>
              </div>
            </section>

            <section id="spots-featured" className="spots-featured">
              <div className="spots-section-title-row">
                <h2>Featured Spots & Events</h2>
              </div>
              <div className="spots-feature-grid">
                {featuredCards.map(card => (
                  <button
                    key={card.title}
                    type="button"
                    className={cx(
                      'spots-feature-card',
                      categoryMatches(card.categories) && 'spots-card-category-match',
                      selectedMarketingCard === card.title && 'spots-card-selected'
                    )}
                    aria-pressed={selectedMarketingCard === card.title}
                    onClick={() => selectMarketingCard(card.title)}
                  >
                    <span className="spots-feature-image">
                      <img src={card.image} alt={card.title} />
                      {card.badge ? (
                        <span className={`spots-badge spots-badge-${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      ) : null}
                      <span className="spots-heart">
                        <Heart size={16} />
                      </span>
                    </span>
                    <span className="spots-feature-body">
                      <strong>{card.title}</strong>
                      <small>{card.area}</small>
                      <span>
                        <em>⭐ {card.meta}</em>
                        <Bookmark size={16} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="spots-dashboard-grid">
              <SectionCard
                id="spots-trending"
                title="Trending Nearby"
                action="View all"
                onAction={() => scrollToSection('spots-trending')}
              >
                <div className="spots-list-stack">
                  {listCards.map(card => (
                    <button
                      key={card.title}
                      type="button"
                      className={cx(
                        'spots-horizontal-card',
                        categoryMatches(card.categories) && 'spots-card-category-match',
                        selectedMarketingCard === card.title && 'spots-card-selected'
                      )}
                      aria-pressed={selectedMarketingCard === card.title}
                      onClick={() => selectMarketingCard(card.title)}
                    >
                      <img src={card.image} alt={card.title} />
                      <span>
                        <strong>{card.title}</strong>
                        <small>{card.subtitle}</small>
                        <em>⭐ {card.meta}</em>
                      </span>
                      <Bookmark size={20} />
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                id="spots-events"
                title="Popular Events"
                action="View all"
                onAction={() => {
                  setSelectedChipId('events');
                  scrollToSection('spots-events');
                }}
              >
                <div className="spots-list-stack">
                  {events.map(event => (
                    <button
                      key={event.title}
                      type="button"
                      className={cx(
                        'spots-event-card',
                        categoryMatches(event.categories) && 'spots-card-category-match',
                        selectedMarketingCard === event.title && 'spots-card-selected'
                      )}
                      aria-pressed={selectedMarketingCard === event.title}
                      onClick={() => {
                        setSelectedChipId('events');
                        selectMarketingCard(event.title);
                      }}
                    >
                      <span className="spots-date-tile">
                        <small>{event.month}</small>
                        <strong>{event.day}</strong>
                      </span>
                      <span>
                        <strong>{event.title}</strong>
                        <small>{event.area}</small>
                        <em>{event.when}</em>
                      </span>
                      <img src={event.image} alt={event.title} />
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                id="spots-updates"
                title="Saved Spots Updates"
                action="View all"
                onAction={() => scrollToSection('spots-updates')}
              >
                <div className="spots-list-stack">
                  {updates.map(update => (
                    <button
                      key={update.title}
                      type="button"
                      className={cx(
                        'spots-update-card',
                        categoryMatches(update.categories) && 'spots-card-category-match',
                        selectedMarketingCard === update.title && 'spots-card-selected'
                      )}
                      aria-pressed={selectedMarketingCard === update.title}
                      onClick={() => selectMarketingCard(update.title)}
                    >
                      <img src={update.image} alt={update.title} />
                      <span>
                        <strong>{update.title}</strong>
                        <small>{update.desc}</small>
                        <em>{update.time}</em>
                      </span>
                      <i aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Why Spots?">
                <div className="spots-why-stack" id="spots-about">
                  {[
                    'Real local recommendations',
                    'Crowd insights & live updates',
                    'Save, share & plan with ease',
                    'Made for the Qatar community',
                  ].map(item => (
                    <div key={item} className="spots-check-row">
                      <span>✓</span>
                      {item}
                    </div>
                  ))}
                  <div className="spots-house-card">
                    <div>⌂</div>
                    <span>Made for everyday discovery</span>
                  </div>
                </div>
              </SectionCard>
            </section>

            <section className="spots-guide-grid">
              <div className="spots-guide-intro">
                <h3>
                  Your all-in-one
                  <br />
                  Qatar guide
                </h3>
                <p>Explore. Share. Connect.</p>
              </div>

              <button
                type="button"
                className={cx('spots-guide-card', selectedGuideStep === 'explore' && 'active')}
                aria-pressed={selectedGuideStep === 'explore'}
                onClick={() => selectGuideStep('explore')}
              >
                <span>
                  <Search size={20} />
                </span>
                <strong>1. Explore & Discover</strong>
                <p>Find the best places, events and outdoor spots near you with honest reviews.</p>
              </button>

              <button
                type="button"
                className={cx('spots-guide-card', selectedGuideStep === 'post' && 'active')}
                aria-pressed={selectedGuideStep === 'post'}
                onClick={() => selectGuideStep('post')}
              >
                <span>
                  <PencilLine size={20} />
                </span>
                <strong>2. Share & Post</strong>
                <p>Post updates, photos and tips to help the community discover more.</p>
              </button>

              <button
                type="button"
                className={cx('spots-guide-card', selectedGuideStep === 'manage' && 'active')}
                aria-pressed={selectedGuideStep === 'manage'}
                onClick={() => selectGuideStep('manage')}
              >
                <span>
                  <User size={20} />
                </span>
                <strong>3. Save & Manage</strong>
                <p>Save your favorite spots and manage your profile and activity.</p>
              </button>

              <button
                type="button"
                className={cx('spots-mini-account', selectedGuideStep === 'manage' && 'active')}
                aria-pressed={selectedGuideStep === 'manage'}
                onClick={() => selectGuideStep('manage')}
              >
                <span className="spots-mini-account-head">
                  <img
                    src={landingImages.avatar}
                    alt="Ali"
                  />
                  <span>
                    <strong>Ali Al-Thani</strong>
                    <small>@ali_qtr</small>
                  </span>
                </span>
                <span className="spots-mini-account-stats">
                  {[
                    ['128', 'Posts'],
                    ['342', 'Followers'],
                    ['215', 'Following'],
                  ].map(([number, label]) => (
                    <span key={label}>
                      <strong>{number}</strong>
                      <small>{label}</small>
                    </span>
                  ))}
                </span>
              </button>
            </section>

            <section id="spots-community" className="spots-cta">
              <div>
                <h3>Join the Spots community</h3>
                <p>
                  Be part of Qatar’s most trusted local discovery platform. Share your favorite spots and stay close to what matters.
                </p>
              </div>
              <div className="spots-cta-actions">
                <button type="button" onClick={onRegister}>
                  Create an Account
                </button>
                <button type="button" onClick={() => onExplore()}>
                  Explore Spots
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
