// data/broadcasts.ts
// Streaming service mapping - which services carry which channels

export const CHANNEL_STREAMING_MAP: Record<string, string[]> = {
  // National Broadcasts
  'FOX': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],
  'FS1': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],
  'FOX/FS1': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],
  'ESPN': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],
  'ESPN2': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],
  'TBS': ['YouTube TV', 'Hulu Live', 'Sling'],
  'NBC': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling', 'Peacock'],
  'NBCSN': ['YouTube TV', 'Fubo', 'Hulu Live', 'Sling'],

  // Streaming Exclusives
  'Apple TV+': ['Apple TV+ ($13/mo)'],
  'Peacock': ['Peacock ($8/mo)'],
  'Netflix': ['Netflix ($15/mo)'],
  'Amazon': ['Amazon Prime Video'],

  // Regional Sports Networks
  'YES': ['YouTube TV', 'Amazon Prime (in-market)'],
  'SNY': ['YouTube TV', 'Fubo', 'Amazon Prime (in-market)'],
  'NESN': ['YouTube TV', 'Fubo', 'NESN 360'],
  'MASN': ['YouTube TV', 'Fubo'],
  'Bally Sports': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Florida': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Sun': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Ohio': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Detroit': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Midwest': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Southwest': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports South': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports West': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Wisconsin': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'Bally Sports Kansas City': ['Bally Sports+ ($20/mo)', 'Fubo (select markets)'],
  'NBC Sports Chicago': ['YouTube TV', 'Fubo', 'Hulu Live'],
  'NBC Sports Philadelphia': ['YouTube TV', 'Fubo', 'Hulu Live'],
  'NBC Sports Bay Area': ['YouTube TV', 'Fubo', 'Hulu Live'],
  'NBC Sports California': ['YouTube TV', 'Fubo', 'Hulu Live'],
  'NBCS Bay Area': ['YouTube TV', 'Fubo', 'Hulu Live'],
  'Marquee': ['YouTube TV', 'Marquee+ ($10/mo)'],
  'Marquee Sports Network': ['YouTube TV', 'Marquee+ ($10/mo)'],
  'SportsNet LA': ['Spectrum (exclusive)', 'DirecTV'],
  'SportsNet Pittsburgh': ['YouTube TV', 'Fubo'],
  'Sportsnet': ['Sportsnet NOW (Canada)'],
  'Space City Home Network': ['SCHN+ ($20/mo)', 'DirecTV'],

  // Direct-to-Consumer / ESPN+
  'MLB.TV': ['MLB.TV ($13/mo)', 'ESPN+ Bundle'],
  'Dbacks.TV': ['ESPN+ ($11/mo)'],
  'Guardians.TV': ['ESPN+ ($11/mo)'],
  'Twins.TV': ['ESPN+ ($11/mo)'],
  'Rockies.TV': ['ESPN+ ($11/mo)'],
  'Mariners.TV': ['MLB.TV (in-market only)'],
  'Padres.TV': ['ESPN+ ($11/mo)'],
  'Nationals.TV': ['MLB.TV (in-market only)'],
};

// National broadcast networks (used for identifying national games)
export const NATIONAL_BROADCASTS = [
  'Netflix', 'Apple TV+', 'ESPN', 'TBS', 'NBC', 'Peacock', 'NBCSN', 'FOX', 'FOX/FS1', 'FS1', 'Amazon'
];

// RSN identifiers (used for identifying regional broadcasts)
export const RSN_BROADCASTS = [
  'YES', 'SNY', 'NESN', 'MASN', 'Bally', 'NBC Sports', 'Marquee', 'SportsNet',
  'Dbacks.TV', 'Guardians.TV', 'Twins.TV', 'Rockies.TV', 'Mariners.TV',
  'Padres.TV', 'Nationals.TV', 'NBCS Bay Area', 'Space City Home Network'
];
