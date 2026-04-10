// src/samplePosts.ts
import type { CreateSpotPostInput } from './types/post';

type DemoSpotPost = Omit<CreateSpotPostInput, 'locationName'>;

export const SAMPLE_POSTS: DemoSpotPost[] = [
  // 🎣 Fishing
  {
    category: 'fishing',
    lat: 25.2950,
    lng: 51.5385,
    text: 'Corniche water is calm this morning, light breeze and almost no waves. Small fish biting near the rocks around 6–7 AM.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.3702,
    lng: 51.5312,
    text: 'Katara Beach fishing spot is a bit crowded tonight but still got a few good bites close to the pier.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.4186,
    lng: 51.5310,
    text: 'Lusail Marina feels quiet today. Tried for an hour after sunset, very few bites and the water looks a bit murky.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.2948,
    lng: 51.5391,
    text: 'Near MIA Park: good visibility and clean water, best bites were between 5:30 and 6:30 AM.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.1635,
    lng: 51.6034,
    text: 'Al Wakra beach side has many small fish, light tackle works best. Spot gets a bit crowded after 8 PM.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.2702,
    lng: 51.4461,
    text: 'Aspire Zone canal: calm water and quiet place to fish in the late afternoon, not many people around.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'fishing',
    lat: 25.3709,
    lng: 51.5404,
    text: 'Close to The Pearl marina: clear water but boats pass frequently, so you need to time your casts between the waves.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },

  // 🎉 Events
  {
    category: 'event',
    lat: 25.3702,
    lng: 51.5312,
    text: 'Cultural night event at Katara with live music and traditional shows. Parking is getting full after sunset.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'event',
    lat: 25.3270,
    lng: 51.5321,
    text: 'Food festival near DECC metro station: long queues at popular stalls, better to arrive early if you hate waiting.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'event',
    lat: 25.3166,
    lng: 51.4362,
    text: 'Book fair at Qatar National Library today. Calm atmosphere, workshops inside and coffee spots are not too busy.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'event',
    lat: 25.2872,
    lng: 51.5336,
    text: 'Evening gathering at Souq Waqif: crowded but lively, good place to walk, grab karak, and people-watch.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
  {
    category: 'event',
    lat: 25.2854,
    lng: 51.5333,
    text: 'Small startup meetup in Msheireb café. Mostly students and young professionals sharing project ideas.',
    userId: 'zBke1KjxAteHFBSzuoC4dHj2Fme2',
  },
];
