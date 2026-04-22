#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'fixtures', 'qatar-discovery.seed-manifest.json'),
    'utf8'
  )
);

const {
  ADMIN_USER,
  ORGANIZATION_USERS,
  PLACE_FIXTURES,
  PRIORITY_AREAS,
  REGULAR_USERS,
} = require('./fixtures/qatar-discovery-fixtures.cjs');

const DEFAULT_PROJECT_ID = manifest.projectId;
const FIREBASE_CONFIGSTORE_PATH = path.join(
  os.homedir(),
  '.config',
  'configstore',
  'firebase-tools.json'
);
const FIRESTORE_BATCH_LIMIT = 400;
const QATAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PROFILE_ACTIVITY_WEIGHTS = {
  coffee: 1.18,
  study: 1.12,
  dessert: 1.16,
  culture: 1.22,
  waterfront: 1.28,
  walking: 1.1,
  sports: 1.06,
  familyDining: 1.08,
  casualDining: 1.04,
  beach: 0.92,
  fishing: 0.88,
};

const POST_CATEGORY_BANK = {
  coffee: ['sighting', 'sighting', 'weather', 'weather', 'event'],
  study: ['sighting', 'sighting', 'weather', 'event'],
  dessert: ['sighting', 'sighting', 'event'],
  culture: ['sighting', 'sighting', 'event'],
  waterfront: ['weather', 'weather', 'sighting', 'sighting', 'event'],
  walking: ['weather', 'sighting', 'sighting', 'event'],
  sports: ['sighting', 'sighting', 'weather', 'event'],
  familyDining: ['sighting', 'sighting', 'event'],
  casualDining: ['sighting', 'sighting', 'weather', 'event'],
  beach: ['weather', 'weather', 'sighting'],
  fishing: ['fishing', 'weather', 'sighting'],
};

const EVENT_CATEGORY_BY_PROFILE = {
  coffee: 'event',
  study: 'event',
  dessert: 'event',
  culture: 'event',
  waterfront: 'event',
  walking: 'event',
  sports: 'event',
  familyDining: 'event',
  casualDining: 'event',
  beach: 'weather',
  fishing: 'fishing',
};

const RECENT_DAY_PATTERNS = {
  weekday_morning: [0, 1, 4, 5, 6, 7, 8],
  weekday_student: [0, 1, 2, 5, 6, 7, 8],
  late_evening: [0, 2, 3, 4, 7, 9],
  evening_cultural: [1, 2, 3, 4, 8, 9],
  sunset_peak: [1, 2, 3, 4, 8, 9],
  after_sunset: [1, 2, 3, 5, 8, 9],
  after_work_active: [0, 1, 2, 3, 7, 8],
  weekend_family: [3, 4, 5, 10, 11],
  weekday_lunch_evening: [0, 1, 2, 5, 6, 7],
  late_afternoon_sunset: [2, 3, 4, 9, 10],
  coastal_window: [2, 3, 4, 9, 10],
};

const FUTURE_DAY_PATTERNS = {
  weekday_morning: [1, 2, 7, 8, 9, 14],
  weekday_student: [1, 2, 7, 8, 9, 13],
  late_evening: [2, 3, 4, 9, 10, 11],
  evening_cultural: [2, 3, 4, 5, 9, 10, 11],
  sunset_peak: [2, 3, 4, 5, 9, 10, 11],
  after_sunset: [2, 3, 4, 5, 10, 11],
  after_work_active: [1, 2, 3, 8, 9, 10],
  weekend_family: [3, 4, 5, 10, 11, 12],
  weekday_lunch_evening: [1, 2, 3, 8, 9, 10],
  late_afternoon_sunset: [3, 4, 10, 11, 12],
  coastal_window: [3, 4, 10, 11, 12],
};

const POST_HOUR_PATTERNS = {
  weekday_morning: [7, 8, 9, 10, 11, 13],
  weekday_student: [10, 12, 15, 17, 19, 21],
  late_evening: [18, 19, 20, 21, 22, 23],
  evening_cultural: [17, 18, 19, 20, 21],
  sunset_peak: [17, 18, 19, 20],
  after_sunset: [18, 19, 20, 21],
  after_work_active: [17, 18, 19, 20, 21],
  weekend_family: [15, 16, 17, 18, 19, 20],
  weekday_lunch_evening: [12, 13, 18, 19, 20],
  late_afternoon_sunset: [16, 17, 18, 19],
  coastal_window: [6, 7, 17, 18, 19],
};

const EVENT_HOUR_PATTERNS = {
  weekday_morning: [9, 10, 11],
  weekday_student: [16, 17, 18, 19],
  late_evening: [19, 20, 21],
  evening_cultural: [18, 19, 20],
  sunset_peak: [17, 18, 19],
  after_sunset: [18, 19, 20],
  after_work_active: [18, 19, 20],
  weekend_family: [16, 17, 18, 19],
  weekday_lunch_evening: [12, 13, 19],
  late_afternoon_sunset: [17, 18, 19],
  coastal_window: [16, 17, 18],
};

const EVENT_DURATION_HOURS = {
  coffee: [2, 2.5],
  study: [2, 3],
  dessert: [2, 2.5],
  culture: [2.5, 3],
  waterfront: [2, 2.5],
  walking: [1.5, 2],
  sports: [1.5, 2],
  familyDining: [2, 2.5],
  casualDining: [2, 2.5],
  beach: [2, 2.5],
  fishing: [2.5, 3],
};

function parseArgs(argv) {
  const args = {
    apply: false,
    phase: 'all',
    project: DEFAULT_PROJECT_ID,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--apply') {
      args.apply = true;
      continue;
    }

    if (arg === '--phase') {
      args.phase = argv[index + 1] || 'all';
      index += 1;
      continue;
    }

    if (arg === '--project') {
      args.project = argv[index + 1] || DEFAULT_PROJECT_ID;
      index += 1;
      continue;
    }
  }

  if (!['all', 'phaseA', 'phaseB'].includes(args.phase)) {
    throw new Error(
      'Only "--phase all", "--phase phaseA", and "--phase phaseB" are supported.'
    );
  }

  return args;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickFrom(list, seed) {
  return list[hashString(seed) % list.length];
}

function padNumber(value, size) {
  return String(value).padStart(size, '0');
}

function buildSentence(parts) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDayLabel(date) {
  return QATAR_WEEKDAYS[date.getUTCDay()];
}

function shiftDate(date, dayDelta) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + dayDelta);
  return next;
}

function withUtcTime(date, hour, minute) {
  const next = new Date(date);
  next.setUTCHours(hour, minute, 0, 0);
  return next;
}

function allocateCounts(items, total, weightFn, minFn) {
  const minima = items.map(item => minFn(item));
  const minimumTotal = minima.reduce((sum, value) => sum + value, 0);
  if (minimumTotal > total) {
    throw new Error(`Minimum allocation ${minimumTotal} exceeds total ${total}.`);
  }

  const weights = items.map(item => Math.max(0.001, weightFn(item)));
  const remaining = total - minimumTotal;
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  const exactShares = items.map((item, index) => ({
    item,
    index,
    exact: minima[index] + (remaining * weights[index]) / totalWeight,
  }));

  const counts = exactShares.map(entry => Math.floor(entry.exact));
  let remainder = total - counts.reduce((sum, value) => sum + value, 0);

  exactShares
    .map(entry => ({
      ...entry,
      fraction: entry.exact - Math.floor(entry.exact),
      tieBreaker: hashString(`${entry.item.id}:allocation`),
    }))
    .sort((left, right) => {
      if (right.fraction !== left.fraction) {
        return right.fraction - left.fraction;
      }

      return left.tieBreaker - right.tieBreaker;
    })
    .forEach(entry => {
      if (remainder <= 0) {
        return;
      }

      counts[entry.index] += 1;
      remainder -= 1;
    });

  return new Map(items.map((item, index) => [item.id, counts[index]]));
}

function buildOwnedOrgMaps() {
  const orgMap = new Map();
  ORGANIZATION_USERS.forEach(org => orgMap.set(org.id, org));
  return orgMap;
}

function buildAllUsers() {
  return [
    ...REGULAR_USERS.map(user => ({
      ...user,
      role: 'user',
    })),
    ...ORGANIZATION_USERS.map(user => ({
      ...user,
      role: 'organization',
      favoriteAreas: user.managedAreas,
      interestProfiles: ['culture', 'coffee', 'familyDining', 'waterfront'],
    })),
    {
      ...ADMIN_USER,
      role: 'admin',
      homeArea: 'Doha',
      favoriteAreas: PRIORITY_AREAS,
      interestProfiles: ['culture', 'coffee', 'waterfront', 'walking'],
    },
  ];
}

function chooseActor(candidates, key, topLimit = 4) {
  const sorted = [...candidates].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.id.localeCompare(right.id);
  });

  const pool = sorted.slice(0, Math.max(1, Math.min(topLimit, sorted.length)));
  return pool[hashString(key) % pool.length];
}

function choosePostAuthor(place, category, index, allUsers, orgById) {
  const key = `${place.id}:post-author:${index}:${category}`;
  const ownerOrg = orgById.get(place.ownerOrgId);

  const candidates = allUsers
    .filter(user => user.role === 'user' || user.role === 'organization')
    .map(user => {
      let score = 1;

      if (user.homeArea === place.area) {
        score += 7;
      }

      if (user.favoriteAreas.includes(place.area)) {
        score += 5;
      }

      if (user.interestProfiles.includes(place.primaryCategory)) {
        score += 4;
      }

      if (user.role === 'organization') {
        score += user.id === place.ownerOrgId ? (category === 'event' ? 8 : 4) : -2;
      }

      if (user.id === ownerOrg?.id && place.featured) {
        score += 2;
      }

      if (user.role === 'user' && category !== 'event') {
        score += 2;
      }

      return { ...user, score };
    });

  return chooseActor(candidates, key);
}

function chooseCommentAuthor(post, place, index, allUsers) {
  const key = `${post.id}:comment:${index}`;

  const candidates = allUsers
    .filter(user => user.id !== post.userId)
    .map(user => {
      let score = 1;

      if (user.homeArea === place.area) {
        score += 6;
      }

      if (user.favoriteAreas.includes(place.area)) {
        score += 4;
      }

      if (user.interestProfiles.includes(place.primaryCategory)) {
        score += 3;
      }

      if (user.role === 'organization' && user.id === place.ownerOrgId) {
        score += 2;
      }

      return { ...user, score };
    });

  return chooseActor(candidates, key, 6);
}

function chooseReactionUsers(post, place, count, allUsers) {
  const candidates = allUsers
    .filter(user => user.id !== post.userId)
    .map(user => {
      let score = 1;

      if (user.homeArea === place.area) {
        score += 7;
      }

      if (user.favoriteAreas.includes(place.area)) {
        score += 6;
      }

      if (user.interestProfiles.includes(place.primaryCategory)) {
        score += 4;
      }

      if (user.role === 'organization' && user.id === place.ownerOrgId) {
        score += 2;
      }

      return { ...user, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.id.localeCompare(right.id);
    });

  const rotated = candidates.map((candidate, index) => ({
    ...candidate,
    rankKey: hashString(`${post.id}:reaction:${candidate.id}:${index}`),
  }));

  rotated.sort((left, right) => left.rankKey - right.rankKey);

  return rotated.slice(0, Math.min(count, rotated.length));
}

function buildRecentTimestamp(baseDate, behavior, key) {
  const offsets = RECENT_DAY_PATTERNS[behavior] || RECENT_DAY_PATTERNS.weekday_morning;
  const hours = POST_HOUR_PATTERNS[behavior] || POST_HOUR_PATTERNS.weekday_morning;
  const dayOffset = pickFrom(offsets, `${key}:day`);
  const hour = pickFrom(hours, `${key}:hour`);
  const minute = pickFrom([4, 9, 13, 18, 24, 31, 37, 43, 51, 56], `${key}:minute`);
  const day = shiftDate(baseDate, -dayOffset);

  return withUtcTime(day, hour, minute);
}

function buildFutureTimestamp(baseDate, behavior, key) {
  const offsets = FUTURE_DAY_PATTERNS[behavior] || FUTURE_DAY_PATTERNS.weekday_morning;
  const hours = EVENT_HOUR_PATTERNS[behavior] || EVENT_HOUR_PATTERNS.weekday_morning;
  const dayOffset = pickFrom(offsets, `${key}:future-day`);
  const hour = pickFrom(hours, `${key}:future-hour`);
  const minute = pickFrom([0, 10, 15, 20, 30, 35, 45, 50], `${key}:future-minute`);
  const day = shiftDate(baseDate, dayOffset);

  return withUtcTime(day, hour, minute);
}

function buildPostText(place, category, createdAt, key) {
  const timeLabels = {
    weekday_morning: ['before the 10:00 rush', 'around the first coffee window', 'through the early work crowd'],
    weekday_student: ['before the study tables filled up', 'through the evening student wave', 'while the library crowd was still moving'],
    late_evening: ['after dinner', 'through the late sweet run', 'once the night crowd settled in'],
    evening_cultural: ['just before the main evening crowd', 'through the family evening window', 'around the courtyard lights'],
    sunset_peak: ['close to sunset', 'once the light softened', 'through the waterfront breeze'],
    after_sunset: ['after sunset', 'once the air cooled down', 'through the evening loop'],
    after_work_active: ['right after work', 'around the busiest training window', 'through the late activity push'],
    weekend_family: ['through the family window', 'right before the weekend rush', 'into the early evening crowd'],
    weekday_lunch_evening: ['just before lunch', 'through the midday wave', 'once dinner service picked up'],
    late_afternoon_sunset: ['through the late afternoon light', 'close to sunset', 'once the heat dropped'],
    coastal_window: ['through the best coastal window', 'closer to sunset', 'after the wind eased a little'],
  };

  const timeHint = pickFrom(timeLabels[place.openNowSeedBehavior], `${key}:time-hint`);
  const crowdWords = pickFrom(
    [
      'felt smoother than usual',
      'was moving steadily',
      'stayed calm for longer than expected',
      'picked up quickly',
      'was easy to settle into',
    ],
    `${key}:crowd`
  );

  const templates = {
    coffee: {
      sighting: [
        `Quiet tables at ${place.name} in ${place.area} ${crowdWords} ${timeHint}.`,
        `${place.name} stayed good for a short coffee stop ${timeHint}, with the side tables opening up again.`,
      ],
      event: [
        `Small coffee set running at ${place.name} tonight, and ${place.area} is already feeling a little livelier than usual.`,
        `Bar team at ${place.name} is leaning into a softer evening setup tonight. ${place.area} should feel best ${timeHint}.`,
      ],
      weather: [
        `The shaded side at ${place.name} felt noticeably better today, especially ${timeHint}.`,
        `AC and seating balance at ${place.name} held up well today. ${place.area} felt easiest ${timeHint}.`,
      ],
    },
    study: {
      sighting: [
        `${place.name} still had usable study seats ${timeHint}, with the quieter tables at the back lasting longest.`,
        `The student flow at ${place.name} ${crowdWords} ${timeHint}. Good window for a focused session.`,
      ],
      event: [
        `Group study tables at ${place.name} are filling up for tonight's session. ${place.area} feels busier but still manageable.`,
        `Workshop setup at ${place.name} is already in motion. Best arrival still looks like ${timeHint}.`,
      ],
      weather: [
        `${place.name} felt comfortable for a long sit today, especially ${timeHint}.`,
        `The indoor side of ${place.name} handled the weather well today and the quieter desks held up ${timeHint}.`,
      ],
    },
    dessert: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Dessert queue stayed shorter than expected.`,
        `Late plates at ${place.name} are moving well tonight and the seating rhythm feels cleaner ${timeHint}.`,
      ],
      event: [
        `Special dessert drop at ${place.name} tonight, and ${place.area} has a proper evening pull already.`,
        `${place.name} is leaning into a bigger sweet crowd tonight. Best window still looks like ${timeHint}.`,
      ],
      weather: [
        `${place.name} felt strongest once the heat dropped ${timeHint}.`,
        `Indoor comfort at ${place.name} was noticeably better tonight, especially ${timeHint}.`,
      ],
    },
    culture: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Families started arriving a little earlier today.`,
        `Foot traffic around ${place.name} stayed balanced tonight, with the calmer edge holding ${timeHint}.`,
      ],
      event: [
        `Courtyard program at ${place.name} is drawing a neat crowd tonight. ${place.area} feels active without getting messy.`,
        `Evening setup at ${place.name} is already visible and the surrounding walk is picking up ${timeHint}.`,
      ],
      weather: [
        `${place.name} felt best once the breeze picked up ${timeHint}.`,
        `Outdoor comfort around ${place.name} improved a lot tonight and the walk feels easiest ${timeHint}.`,
      ],
    },
    waterfront: {
      sighting: [
        `Steady movement around ${place.name} in ${place.area}. The waterfront felt easiest ${timeHint}.`,
        `${place.name} picked up nicely near the water ${timeHint}, but the path still stayed easy to move through.`,
      ],
      event: [
        `Waterfront meet-up near ${place.name} later tonight. ${place.area} already has that soft pre-event movement.`,
        `${place.name} is shaping into a stronger evening stop tonight, especially ${timeHint}.`,
      ],
      weather: [
        `Breeze around ${place.name} was noticeably better ${timeHint}. This side of ${place.area} feels strongest once the sun drops.`,
        `The air near ${place.name} turned much easier to sit with ${timeHint}. Best coastal window so far today.`,
      ],
    },
    walking: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Plenty of room for a slower walk.`,
        `The walking loop near ${place.name} felt smoother tonight, especially ${timeHint}.`,
      ],
      event: [
        `Community walking group meeting near ${place.name} later tonight. The route looks clean ${timeHint}.`,
        `${place.name} is turning into a stronger start point for tonight's walk, with good movement already building.`,
      ],
      weather: [
        `Air around ${place.name} finally settled ${timeHint}, and the route feels easiest now.`,
        `The walking window near ${place.name} got much better once the light softened ${timeHint}.`,
      ],
    },
    sports: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Good energy without feeling overloaded.`,
        `Training traffic around ${place.name} lifted tonight, but the turnaround stayed efficient ${timeHint}.`,
      ],
      event: [
        `Small activity push at ${place.name} later tonight. ${place.area} is already showing a stronger after-work rhythm.`,
        `${place.name} has a busier session lined up this evening and the warm-up crowd is starting to show.`,
      ],
      weather: [
        `${place.name} felt strongest once the heat eased ${timeHint}.`,
        `Outdoor movement near ${place.name} got much better ${timeHint} once the air cooled down.`,
      ],
    },
    familyDining: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Family tables turned over faster than usual.`,
        `${place.name} felt easy for a longer family stop tonight, especially ${timeHint}.`,
      ],
      event: [
        `Family night at ${place.name} later today and ${place.area} is already leaning into a busier evening rhythm.`,
        `${place.name} has a stronger family pull tonight, with the easiest arrival still looking like ${timeHint}.`,
      ],
      weather: [
        `Comfort level at ${place.name} was better tonight once the air cooled ${timeHint}.`,
        `${place.name} felt far better than midday, especially ${timeHint}.`,
      ],
    },
    casualDining: {
      sighting: [
        `Lunch pace at ${place.name} ${crowdWords} ${timeHint}. Good option if you want a cleaner in-and-out.`,
        `${place.name} kept a smooth service rhythm today, especially ${timeHint}.`,
      ],
      event: [
        `Extra evening pull around ${place.name} tonight and the tables are turning faster already.`,
        `${place.name} is pushing into a livelier dinner rhythm tonight, especially ${timeHint}.`,
      ],
      weather: [
        `Indoor comfort at ${place.name} felt balanced today, and the better window was clearly ${timeHint}.`,
        `${place.name} held up well through the weather today, with the easiest arrival still ${timeHint}.`,
      ],
    },
    beach: {
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. Families started settling in closer to sunset.`,
        `The beach side near ${place.name} finally felt comfortable ${timeHint}.`,
      ],
      event: [
        `Sunset gathering near ${place.name} later today. ${place.area} is already getting that soft end-of-day movement.`,
        `${place.name} looks strongest for tonight's west-coast stop, especially ${timeHint}.`,
      ],
      weather: [
        `Wind and light near ${place.name} lined up much better ${timeHint}.`,
        `The west-facing window at ${place.name} felt best ${timeHint}, once the sun dropped a little.`,
      ],
    },
    fishing: {
      fishing: [
        `Late casts near ${place.name} looked better ${timeHint}. The water settled enough for a cleaner short session.`,
        `${place.name} felt like a better fishing window ${timeHint}, with the calmer edge working best.`,
      ],
      weather: [
        `Wind around ${place.name} eased a little ${timeHint}, which made the coastal stop feel more usable.`,
        `The sea-side air near ${place.name} turned much friendlier ${timeHint}.`,
      ],
      sighting: [
        `${place.name} in ${place.area} ${crowdWords} ${timeHint}. More people stayed through sunset than earlier in the day.`,
        `The coastal edge by ${place.name} felt livelier tonight, but still calm enough for a slower stop.`,
      ],
    },
  };

  const categoryTemplates = templates[place.primaryCategory][category];
  return pickFrom(categoryTemplates, `${key}:post-text`);
}

function buildCommentText(post, place, commentIndex, author) {
  const templates = [
    `Saw the same thing at ${place.name}. ${place.area} felt best once the rush softened.`,
    `Good timing. ${place.name} usually feels smoother around that window.`,
    `Tried it a bit later and the pace still felt manageable.`,
    `Agree on this one. ${place.area} is reading well tonight.`,
    `Helpful note. That side of ${place.name} has been the easiest all week.`,
    `${author.username.split(' ')[0]} noticed the same yesterday. Clean call.`,
    `This matches what I saw too. Best part was how steady the flow stayed.`,
    `Useful one. ${place.name} keeps getting stronger at that time.`,
  ];

  return pickFrom(templates, `${post.id}:comment-body:${commentIndex}`);
}

function buildEventTitle(place, key) {
  const normalizedName = place.name.toLowerCase();
  const includesCoffeeWord = /(coffee|cafe|espresso|roast)/.test(normalizedName);
  const includesDessertWord = /(dessert|sweet|gelato|bakery|kunafa)/.test(normalizedName);
  const includesWalkWord = /(walk|boardwalk|corniche|loop)/.test(normalizedName);
  const templates = {
    coffee: [
      `${place.name} Morning Table`,
      `${place.name} Quiet Desk Hours`,
      `${place.name} First Pour Window`,
      `${place.name} Neighborhood Table`,
      `${place.name} Late Bean Session`,
      includesCoffeeWord ? `${place.name} After Lunch Window` : `${place.name} Coffee Circle`,
    ],
    study: [
      `${place.name} Study Session`,
      `${place.name} Notes + Coffee`,
      `${place.name} Evening Desk Hours`,
      `${place.name} After Class Table`,
      `${place.name} Reading Window`,
      `${place.name} Revision Hour`,
    ],
    dessert: [
      `${place.name} Dessert Hour`,
      `${place.name} Late Sweet Run`,
      `${place.name} Evening Plates`,
      `${place.name} Night Counter`,
      `${place.name} After Dinner Window`,
      includesDessertWord ? `${place.name} Evening Queue` : `${place.name} Sweet Table`,
    ],
    culture: [
      `${place.name} Courtyard Night`,
      `${place.name} Family Evening`,
      `${place.name} Art Walk`,
      `${place.name} Culture Hour`,
      `${place.name} Evening Program`,
      `${place.name} Courtyard Session`,
    ],
    waterfront: [
      `${place.name} Sunset Gather`,
      `${place.name} Marina Evening`,
      `${place.name} Waterfront Night`,
      `${place.name} Harbor Window`,
      `${place.name} Boardwalk Meet`,
      includesWalkWord ? `${place.name} Afterglow Stop` : `${place.name} Sunset Walk`,
    ],
    walking: [
      `${place.name} Sunset Walk`,
      `${place.name} Evening Loop`,
      `${place.name} Family Stroll`,
      `${place.name} Cool Air Walk`,
      `${place.name} After Dinner Loop`,
      `${place.name} Community Walk`,
    ],
    sports: [
      `${place.name} After Work Circuit`,
      `${place.name} Evening Run Club`,
      `${place.name} Activity Hour`,
      `${place.name} Training Window`,
      `${place.name} Warm-Up Session`,
      `${place.name} Night Circuit`,
    ],
    familyDining: [
      `${place.name} Family Table Night`,
      `${place.name} Weekend Gathering`,
      `${place.name} Shared Plates Evening`,
      `${place.name} Early Dinner Window`,
      `${place.name} Family Supper`,
      `${place.name} Evening Table`,
    ],
    casualDining: [
      `${place.name} Dinner Window`,
      `${place.name} Lunch Crowd Reset`,
      `${place.name} Evening Service`,
      `${place.name} Midday Table`,
      `${place.name} Night Service`,
      `${place.name} Supper Hour`,
    ],
    beach: [
      `${place.name} Sunset Stop`,
      `${place.name} West Coast Evening`,
      `${place.name} Golden Hour`,
      `${place.name} Dusk Gathering`,
      `${place.name} Shoreline Window`,
      `${place.name} Family Sunset`,
    ],
    fishing: [
      `${place.name} Golden Hour Cast`,
      `${place.name} Coastal Window`,
      `${place.name} Sunset Session`,
      `${place.name} Tide Window`,
      `${place.name} Late Cast`,
      `${place.name} Quiet Shore Session`,
    ],
  };

  return pickFrom(templates[place.primaryCategory], `${key}:event-title`);
}

function buildEventDescription(place, organizerLabel, startTime, key, eventTitle) {
  const dayLabel = getDayLabel(startTime);
  const tone = pickFrom(
    [
      'keeps the energy compact and local',
      'leans into a softer neighborhood pace',
      'is built for a cleaner Qatar evening rhythm',
      'should feel easy to join without needing a long stay',
    ],
    `${key}:event-tone`
  );

  const audience =
    place.primaryCategory === 'study'
      ? 'student-friendly'
      : place.primaryCategory === 'familyDining' || place.primaryCategory === 'walking'
        ? 'family-friendly'
        : 'easy for small groups';

  return buildSentence([
    `${organizerLabel} is programming ${eventTitle} at ${place.name} in ${place.area}.`,
    `It is timed for ${dayLabel.toLowerCase()} ${place.bestTimeWindow.toLowerCase()} and ${tone}.`,
    `Overall vibe should stay ${audience}.`,
  ]);
}

function buildEventDuration(place, key) {
  const options = EVENT_DURATION_HOURS[place.primaryCategory] || [2];
  return pickFrom(options, `${key}:duration`);
}

function buildPosts(baseDate, allUsers, places, targets, orgById) {
  const postCounts = allocateCounts(
    places,
    targets.posts,
    place =>
      (place.priority ? 1.75 : 0.55) *
      (PROFILE_ACTIVITY_WEIGHTS[place.primaryCategory] || 1) *
      (place.featured ? 1.12 : 1),
    place => (place.priority ? 8 : 4)
  );

  const posts = [];
  let serial = 1;

  places.forEach(place => {
    const count = postCounts.get(place.id) || 0;

    for (let index = 0; index < count; index += 1) {
      const id = `${manifest.seedPrefix}_post_${padNumber(serial, 4)}`;
      const category = pickFrom(
        POST_CATEGORY_BANK[place.primaryCategory],
        `${place.id}:post-category:${index}`
      );
      const author = choosePostAuthor(place, category, index, allUsers, orgById);
      const createdAt = buildRecentTimestamp(
        baseDate,
        place.openNowSeedBehavior,
        `${place.id}:post-time:${index}`
      );

      posts.push({
        id,
        userId: author.id,
        authorLabel: author.username,
        placeId: place.id,
        heroImageUrl:
          place.heroImageUrl &&
          (
            index < 4 ||
            place.featured ||
            (place.priority ? index % 2 === 0 : index % 3 === 0)
          )
            ? place.heroImageUrl
            : null,
        text: buildPostText(place, category, createdAt, `${id}:body`),
        category,
        lat: place.lat,
        lng: place.lng,
        locationName: `${place.name}, ${place.area}`,
        createdAt,
        placeArea: place.area,
        placePriority: place.priority,
        placeProfile: place.primaryCategory,
      });

      serial += 1;
    }
  });

  return posts;
}

function buildComments(posts, placesById, allUsers, targets) {
  const commentCounts = allocateCounts(
    posts,
    targets.comments,
    post =>
      (post.placePriority ? 1.4 : 0.7) *
      (post.category === 'event' ? 1.35 : post.category === 'sighting' ? 1.15 : 0.95),
    post => (hashString(`${post.id}:base-comment`) % 3 === 0 ? 1 : 0)
  );

  const comments = [];

  posts.forEach(post => {
    const place = placesById.get(post.placeId);
    const count = commentCounts.get(post.id) || 0;

    for (let index = 0; index < count; index += 1) {
      const commentId = `${manifest.seedPrefix}_comment_${padNumber(comments.length + 1, 4)}`;
      const author = chooseCommentAuthor(post, place, index, allUsers);
      const createdAt = new Date(post.createdAt);
      createdAt.setUTCMinutes(createdAt.getUTCMinutes() + 18 + index * 7);

      comments.push({
        id: commentId,
        postId: post.id,
        userId: author.id,
        authorLabel: author.username,
        text: buildCommentText(post, place, index, author),
        createdAt,
      });
    }
  });

  return comments;
}

function buildReactions(posts, placesById, allUsers, targets) {
  const likeCounts = allocateCounts(
    posts,
    targets.reactions,
    post =>
      (post.placePriority ? 1.55 : 0.75) *
      (post.category === 'event' ? 1.3 : post.category === 'sighting' ? 1.15 : 1),
    post => (post.placePriority ? 2 : 1)
  );

  const reactions = [];

  posts.forEach(post => {
    const place = placesById.get(post.placeId);
    const count = likeCounts.get(post.id) || 0;
    const users = chooseReactionUsers(post, place, count, allUsers);

    users.forEach((user, index) => {
      const createdAt = new Date(post.createdAt);
      createdAt.setUTCMinutes(createdAt.getUTCMinutes() + 35 + index * 5);

      reactions.push({
        id: user.id,
        postId: post.id,
        userId: user.id,
        type: 'like',
        createdAt,
      });
    });
  });

  return reactions;
}

function buildEvents(baseDate, places, targets, orgById) {
  const eventEligiblePlaces = places.filter(
    place => place.primaryCategory !== 'study' || place.priority
  );

  const eventCounts = allocateCounts(
    eventEligiblePlaces,
    targets.events,
    place =>
      (place.priority ? 1.7 : 0.55) *
      (place.featured ? 1.15 : 1) *
      ({
        culture: 1.4,
        waterfront: 1.35,
        dessert: 1.28,
        walking: 1.18,
        coffee: 1.12,
        familyDining: 1.16,
        sports: 1.06,
        casualDining: 1.02,
        study: 0.94,
        beach: 0.9,
        fishing: 0.78,
      }[place.primaryCategory] || 1),
    place => (place.featured ? 1 : 0)
  );

  const events = [];
  let serial = 1;

  eventEligiblePlaces.forEach(place => {
    const count = eventCounts.get(place.id) || 0;
    const organizer = orgById.get(place.ownerOrgId);

    for (let index = 0; index < count; index += 1) {
      const id = `${manifest.seedPrefix}_event_${padNumber(serial, 3)}`;
      const startTime = buildFutureTimestamp(
        baseDate,
        place.openNowSeedBehavior,
        `${place.id}:event-time:${index}`
      );
      const durationHours = buildEventDuration(place, `${place.id}:event-duration:${index}`);
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
      const title = buildEventTitle(place, `${id}:title`);

      events.push({
        id,
        placeId: place.id,
        title,
        description: buildEventDescription(
          place,
          organizer.orgLabel,
          startTime,
          `${id}:description`,
          title
        ),
        category: EVENT_CATEGORY_BY_PROFILE[place.primaryCategory] || 'event',
        locationName: `${place.name}, ${place.area}`,
        venueName: place.name,
        organizerName: organizer.orgLabel,
        heroImageUrl: place.heroImageUrl,
        lat: place.lat,
        lng: place.lng,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        createdBy: organizer.id,
        isPromoted: true,
        createdAt: shiftDate(baseDate, -(index % 5)),
        status: 'active',
        placeArea: place.area,
        placePriority: place.priority,
      });

      serial += 1;
    }
  });

  return events;
}

function buildFavorites(allUsers, posts, placesById, targetCountPerUser = 75) {
  const favorites = [];

  allUsers.forEach(user => {
    const ranked = posts
      .filter(post => post.userId !== user.id)
      .map(post => {
        const place = placesById.get(post.placeId);
        let score = 1;

        if (user.homeArea === place.area) {
          score += 10;
        }

        if (user.favoriteAreas.includes(place.area)) {
          score += 7;
        }

        if (user.interestProfiles.includes(place.primaryCategory)) {
          score += 6;
        }

        if (post.category === 'event') {
          score += 2;
        }

        if (place.featured) {
          score += 3;
        }

        score += hashString(`${user.id}:${post.id}:favorite-rank`) % 4;

        return { post, score };
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.post.id.localeCompare(right.post.id);
      })
      .slice(0, targetCountPerUser);

    ranked.forEach((entry, index) => {
      const createdAt = new Date(entry.post.createdAt);
      createdAt.setUTCMinutes(createdAt.getUTCMinutes() + 90 + index);

      favorites.push({
        userId: user.id,
        postId: entry.post.id,
        createdAt,
      });
    });
  });

  return favorites;
}

function countBy(items, keyFn) {
  const counts = new Map();

  items.forEach(item => {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
}

function buildUserDocuments(allUsers, posts, comments, reactions) {
  const postsByAuthor = countBy(posts, item => item.userId);
  const commentsByAuthor = countBy(comments, item => item.userId);
  const likesByPost = countBy(reactions, item => item.postId);
  const likesReceivedByAuthor = new Map();

  posts.forEach(post => {
    likesReceivedByAuthor.set(
      post.userId,
      (likesReceivedByAuthor.get(post.userId) || 0) + (likesByPost.get(post.id) || 0)
    );
  });

  return allUsers.map(user => {
    const postCount = postsByAuthor.get(user.id) || 0;
    const commentCount = commentsByAuthor.get(user.id) || 0;
    const likeReceivedCount = likesReceivedByAuthor.get(user.id) || 0;
    const xp = postCount * 10 + commentCount * 4 + likeReceivedCount * 2;
    const badgeKeys = [];

    if (postCount > 0) {
      badgeKeys.push('first_post');
    }

    if (commentCount > 0) {
      badgeKeys.push('first_comment');
    }

    if (likeReceivedCount > 0) {
      badgeKeys.push('first_like_received');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      xp,
      badgeKeys,
      username: user.username,
      bio: user.bio,
      language: user.language,
      privacyMode: user.privacyMode,
      createdAt: shiftDate(new Date(manifest.baseTimestamp), -14),
      updatedAt: shiftDate(new Date(manifest.baseTimestamp), -1),
    };
  });
}

function buildSubscriptionDocuments(allUsers) {
  return allUsers.map(user => {
    if (user.role === 'organization') {
      return {
        userId: user.id,
        planLevel: user.planLevel,
        status: user.status,
        createdAt: shiftDate(new Date(manifest.baseTimestamp), -30),
        updatedAt: shiftDate(new Date(manifest.baseTimestamp), -2),
      };
    }

    return {
      userId: user.id,
      planLevel: 'free',
      status: 'active',
      createdAt: shiftDate(new Date(manifest.baseTimestamp), -30),
      updatedAt: shiftDate(new Date(manifest.baseTimestamp), -2),
    };
  });
}

function buildPlacesWithActivity(places, posts, comments, reactions, favorites, events, orgById) {
  const postCounts = countBy(posts, item => item.placeId);
  const commentPostIds = countBy(comments, item => {
    const post = posts.find(candidate => candidate.id === item.postId);
    return post ? post.placeId : 'unknown';
  });
  const reactionPostIds = countBy(reactions, item => {
    const post = posts.find(candidate => candidate.id === item.postId);
    return post ? post.placeId : 'unknown';
  });
  const favoritePostIds = countBy(favorites, item => {
    const post = posts.find(candidate => candidate.id === item.postId);
    return post ? post.placeId : 'unknown';
  });
  const eventCounts = countBy(events, item => item.placeId);

  return places.map(place => ({
    ...place,
    ownerOrgLabel: orgById.get(place.ownerOrgId).orgLabel,
    communityActivityCount:
      (postCounts.get(place.id) || 0) +
      (commentPostIds.get(place.id) || 0) +
      (reactionPostIds.get(place.id) || 0) +
      (favoritePostIds.get(place.id) || 0) +
      (eventCounts.get(place.id) || 0) * 3,
  }));
}

function generateSeedData() {
  const baseDate = new Date(manifest.baseTimestamp);
  const orgById = buildOwnedOrgMaps();
  const allUsers = buildAllUsers();
  const places = PLACE_FIXTURES.map(place => ({ ...place }));
  const placesById = new Map(places.map(place => [place.id, place]));
  const posts = buildPosts(baseDate, allUsers, places, manifest.targets, orgById);
  const comments = buildComments(posts, placesById, allUsers, manifest.targets);
  const reactions = buildReactions(posts, placesById, allUsers, manifest.targets);
  const events = buildEvents(baseDate, places, manifest.targets, orgById);
  const favorites = buildFavorites(allUsers, posts, placesById);
  const users = buildUserDocuments(allUsers, posts, comments, reactions);
  const subscriptions = buildSubscriptionDocuments(allUsers);
  const placesWithActivity = buildPlacesWithActivity(
    places,
    posts,
    comments,
    reactions,
    favorites,
    events,
    orgById
  );

  return {
    users,
    subscriptions,
    posts,
    comments,
    reactions,
    favorites,
    events,
    places: placesWithActivity,
  };
}

function encodeValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(encodeValue),
      },
    };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }

    return { doubleValue: value };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: encodeFields(value),
      },
    };
  }

  throw new Error(`Unsupported Firestore value: ${typeof value}`);
}

function encodeFields(input) {
  const fields = {};

  Object.entries(input).forEach(([key, value]) => {
    fields[key] = encodeValue(value);
  });

  return fields;
}

function normalizeHoursForFirestore(hours) {
  return Object.fromEntries(
    Object.entries(hours).map(([day, windows]) => [
      day,
      windows.map(window => ({
        open: window[0],
        close: window[1],
      })),
    ])
  );
}

function buildPhaseWrites(seedData, phase) {
  const phaseAWrites = [];
  const phaseBWrites = [];

  seedData.users.forEach(user => {
    phaseAWrites.push({
      path: `users/${user.id}`,
      data: user,
    });
  });

  seedData.subscriptions.forEach(subscription => {
    phaseAWrites.push({
      path: `users/${subscription.userId}/subscriptions/current`,
      data: subscription,
    });
  });

  seedData.posts.forEach(post => {
    phaseAWrites.push({
      path: `posts/${post.id}`,
      data: {
        userId: post.userId,
        placeId: post.placeId,
        heroImageUrl: post.heroImageUrl,
        text: post.text,
        category: post.category,
        lat: post.lat,
        lng: post.lng,
        locationName: post.locationName,
        createdAt: post.createdAt,
      },
    });
  });

  seedData.comments.forEach(comment => {
    phaseAWrites.push({
      path: `posts/${comment.postId}/comments/${comment.id}`,
      data: {
        userId: comment.userId,
        authorLabel: comment.authorLabel,
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });
  });

  seedData.reactions.forEach(reaction => {
    phaseAWrites.push({
      path: `posts/${reaction.postId}/reactions/${reaction.id}`,
      data: {
        postId: reaction.postId,
        userId: reaction.userId,
        type: reaction.type,
        createdAt: reaction.createdAt,
      },
    });
  });

  seedData.events.forEach(event => {
    phaseAWrites.push({
      path: `events/${event.id}`,
      data: {
        placeId: event.placeId,
        title: event.title,
        description: event.description,
        category: event.category,
        locationName: event.locationName,
        venueName: event.venueName,
        organizerName: event.organizerName,
        heroImageUrl: event.heroImageUrl,
        lat: event.lat,
        lng: event.lng,
        startTime: event.startTime,
        endTime: event.endTime,
        createdBy: event.createdBy,
        isPromoted: event.isPromoted,
        createdAt: event.createdAt,
        status: event.status,
      },
    });
  });

  seedData.favorites.forEach(favorite => {
    phaseAWrites.push({
      path: `users/${favorite.userId}/favorites/${favorite.postId}`,
      data: favorite,
    });
  });

  if (phase === 'all' || phase === 'phaseB') {
    seedData.places.forEach(place => {
      phaseBWrites.push({
        path: `places/${place.id}`,
        data: {
          id: place.id,
          name: place.name,
          primaryCategory: place.primaryCategory,
          tags: place.tags,
          area: place.area,
          districtGroup: place.districtGroup,
          lat: place.lat,
          lng: place.lng,
          heroImageUrl: place.heroImageUrl,
          heroFallbackTheme: place.heroFallbackTheme,
          hours: normalizeHoursForFirestore(place.hours),
          openNowSeedBehavior: place.openNowSeedBehavior,
          actionLinks: place.actionLinks,
          ownerOrgId: place.ownerOrgId,
          ownerOrgLabel: place.ownerOrgLabel,
          ownerVerified: place.ownerVerified,
          communityActivityCount: place.communityActivityCount,
          budgetLevel: place.budgetLevel,
          bestTimeWindow: place.bestTimeWindow,
          audienceHints: place.audienceHints,
          featured: place.featured,
          priority: place.priority,
        },
      });
    });
  }

  return {
    phaseA: phaseAWrites,
    phaseB: phaseBWrites,
  };
}

function getAreaDistribution(items, getArea) {
  const counts = {};

  items.forEach(item => {
    const area = getArea(item);
    counts[area] = (counts[area] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([area, count]) => ({ area, count }));
}

function printSummary(seedData, phase) {
  const priorityPosts = seedData.posts.filter(post =>
    PRIORITY_AREAS.includes(post.placeArea)
  ).length;
  const priorityEvents = seedData.events.filter(event =>
    PRIORITY_AREAS.includes(event.placeArea)
  ).length;

  const summary = {
    seedId: manifest.seedId,
    phase,
    targets: manifest.targets,
    actual: {
      users: seedData.users.length,
      subscriptions: seedData.subscriptions.length,
      posts: seedData.posts.length,
      comments: seedData.comments.length,
      reactions: seedData.reactions.length,
      favorites: seedData.favorites.length,
      events: seedData.events.length,
      places: phase === 'all' || phase === 'phaseB' ? seedData.places.length : 0,
    },
    geography: {
      priorityPostShare: Number(
        ((priorityPosts / seedData.posts.length) * 100).toFixed(1)
      ),
      priorityEventShare: Number(
        ((priorityEvents / seedData.events.length) * 100).toFixed(1)
      ),
      topPostAreas: getAreaDistribution(seedData.posts, item => item.placeArea).slice(0, 8),
      topEventAreas: getAreaDistribution(seedData.events, item => item.placeArea).slice(0, 8),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

function loadFirebaseToolsConfig() {
  if (!fs.existsSync(FIREBASE_CONFIGSTORE_PATH)) {
    throw new Error(
      'firebase-tools config was not found. Run "npx firebase-tools login" first.'
    );
  }

  return JSON.parse(fs.readFileSync(FIREBASE_CONFIGSTORE_PATH, 'utf8'));
}

function refreshFirebaseLogin() {
  execFileSync('npx', ['firebase-tools', 'projects:list', '--json'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

function getAccessToken() {
  let config = loadFirebaseToolsConfig();

  if (!config.tokens || !config.tokens.access_token) {
    refreshFirebaseLogin();
    config = loadFirebaseToolsConfig();
  }

  const expiresAt = config.tokens.expires_at || 0;
  if (expiresAt <= Date.now() + 120000) {
    refreshFirebaseLogin();
    config = loadFirebaseToolsConfig();
  }

  if (!config.tokens || !config.tokens.access_token) {
    throw new Error(
      'Could not resolve a Firebase CLI access token. Run "npx firebase-tools login" again.'
    );
  }

  return config.tokens.access_token;
}

async function commitWrites(projectId, writes) {
  if (writes.length === 0) {
    return;
  }

  const accessToken = getAccessToken();
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;

  for (let index = 0; index < writes.length; index += FIRESTORE_BATCH_LIMIT) {
    const slice = writes.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: slice.map(write => ({
          update: {
            name: `projects/${projectId}/databases/(default)/documents/${write.path}`,
            fields: encodeFields(write.data),
          },
        })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Firestore commit failed (${response.status}): ${text}`);
    }

    console.log(
      `Committed ${Math.min(index + FIRESTORE_BATCH_LIMIT, writes.length)} / ${writes.length} documents`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedData = generateSeedData();
  const writes = buildPhaseWrites(seedData, args.phase);

  printSummary(seedData, args.phase);

  if (!args.apply) {
    console.log('');
    console.log(
      args.phase === 'phaseA'
        ? 'Dry run only. Re-run with --apply to write Phase A.'
        : args.phase === 'phaseB'
          ? 'Dry run only. Re-run with --apply to write Phase B.'
          : 'Dry run only. Re-run with --apply to write Phase A then Phase B.'
    );
    return;
  }

  if (args.phase === 'phaseA' || args.phase === 'all') {
    console.log('');
    console.log(`Applying Phase A to project ${args.project}...`);
    await commitWrites(args.project, writes.phaseA);
  }

  if (args.phase === 'phaseB' || args.phase === 'all') {
    console.log('');
    console.log(`Applying Phase B to project ${args.project}...`);
    await commitWrites(args.project, writes.phaseB);
  }

  console.log('');
  console.log('Seed apply complete.');
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
} else {
  module.exports = {
    generateSeedData,
    manifest,
    normalizeHoursForFirestore,
  };
}
