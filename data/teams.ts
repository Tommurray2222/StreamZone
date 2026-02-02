// data/teams.ts
// MLB team data with market info and RSN details for 2026

export interface Team {
  city: string;
  state: string;
  market: string;
  rsn: string;
  rsnNote: string;
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  record: string;
}

export const MLB_TEAMS: Record<string, Team> = {
  'Arizona Diamondbacks': { city: 'Phoenix', state: 'AZ', market: 'Phoenix', rsn: 'Dbacks.TV (ESPN)', rsnNote: 'Direct-to-consumer via ESPN app', league: 'NL', division: 'West', record: '0-0' },
  'Atlanta Braves': { city: 'Atlanta', state: 'GA', market: 'Atlanta', rsn: 'Bally Sports South', rsnNote: 'Available on Bally Sports+', league: 'NL', division: 'East', record: '0-0' },
  'Baltimore Orioles': { city: 'Baltimore', state: 'MD', market: 'Baltimore/DC', rsn: 'MASN', rsnNote: 'Mid-Atlantic Sports Network', league: 'AL', division: 'East', record: '0-0' },
  'Boston Red Sox': { city: 'Boston', state: 'MA', market: 'New England', rsn: 'NESN', rsnNote: 'New England Sports Network', league: 'AL', division: 'East', record: '0-0' },
  'Chicago Cubs': { city: 'Chicago', state: 'IL', market: 'Chicago', rsn: 'Marquee Sports Network', rsnNote: 'Cubs-owned network', league: 'NL', division: 'Central', record: '0-0' },
  'Chicago White Sox': { city: 'Chicago', state: 'IL', market: 'Chicago', rsn: 'NBC Sports Chicago', rsnNote: 'Comcast regional network', league: 'AL', division: 'Central', record: '0-0' },
  'Cincinnati Reds': { city: 'Cincinnati', state: 'OH', market: 'Cincinnati', rsn: 'Bally Sports Ohio', rsnNote: 'Available on Bally Sports+', league: 'NL', division: 'Central', record: '0-0' },
  'Cleveland Guardians': { city: 'Cleveland', state: 'OH', market: 'Cleveland', rsn: 'Guardians.TV (ESPN)', rsnNote: 'Direct-to-consumer via ESPN app', league: 'AL', division: 'Central', record: '0-0' },
  'Colorado Rockies': { city: 'Denver', state: 'CO', market: 'Denver/Rocky Mountain', rsn: 'Rockies.TV (ESPN)', rsnNote: 'Direct-to-consumer via ESPN app', league: 'NL', division: 'West', record: '0-0' },
  'Detroit Tigers': { city: 'Detroit', state: 'MI', market: 'Detroit', rsn: 'Bally Sports Detroit', rsnNote: 'Available on Bally Sports+', league: 'AL', division: 'Central', record: '0-0' },
  'Houston Astros': { city: 'Houston', state: 'TX', market: 'Houston', rsn: 'Space City Home Network', rsnNote: 'SCHN+ streaming available ($19.99/mo)', league: 'AL', division: 'West', record: '0-0' },
  'Kansas City Royals': { city: 'Kansas City', state: 'MO', market: 'Kansas City', rsn: 'Bally Sports Kansas City', rsnNote: 'Available on Bally Sports+', league: 'AL', division: 'Central', record: '0-0' },
  'Los Angeles Angels': { city: 'Anaheim', state: 'CA', market: 'Los Angeles', rsn: 'Bally Sports West', rsnNote: 'Available on Bally Sports+', league: 'AL', division: 'West', record: '0-0' },
  'Los Angeles Dodgers': { city: 'Los Angeles', state: 'CA', market: 'Los Angeles', rsn: 'SportsNet LA', rsnNote: 'Spectrum exclusive in some areas', league: 'NL', division: 'West', record: '0-0' },
  'Miami Marlins': { city: 'Miami', state: 'FL', market: 'South Florida', rsn: 'Bally Sports Florida', rsnNote: 'Available on Bally Sports+', league: 'NL', division: 'East', record: '0-0' },
  'Milwaukee Brewers': { city: 'Milwaukee', state: 'WI', market: 'Milwaukee/Wisconsin', rsn: 'Bally Sports Wisconsin', rsnNote: 'Available on Bally Sports+', league: 'NL', division: 'Central', record: '0-0' },
  'Minnesota Twins': { city: 'Minneapolis', state: 'MN', market: 'Twin Cities', rsn: 'Twins.TV (ESPN)', rsnNote: 'Direct-to-consumer via ESPN app', league: 'AL', division: 'Central', record: '0-0' },
  'New York Mets': { city: 'New York', state: 'NY', market: 'New York', rsn: 'SNY', rsnNote: 'Mets-owned, widely available on cable/streaming', league: 'NL', division: 'East', record: '0-0' },
  'New York Yankees': { city: 'New York', state: 'NY', market: 'New York', rsn: 'YES', rsnNote: 'Yankees-owned, on most NY cable/streaming', league: 'AL', division: 'East', record: '0-0' },
  'Oakland Athletics': { city: 'Sacramento', state: 'CA', market: 'Sacramento/Bay Area', rsn: 'NBC Sports California', rsnNote: 'Team relocating to Sacramento 2028', league: 'AL', division: 'West', record: '0-0' },
  'Philadelphia Phillies': { city: 'Philadelphia', state: 'PA', market: 'Philadelphia', rsn: 'NBC Sports Philadelphia', rsnNote: 'Comcast regional network', league: 'NL', division: 'East', record: '0-0' },
  'Pittsburgh Pirates': { city: 'Pittsburgh', state: 'PA', market: 'Pittsburgh', rsn: 'SportsNet Pittsburgh', rsnNote: 'Available via cable/satellite', league: 'NL', division: 'Central', record: '0-0' },
  'San Diego Padres': { city: 'San Diego', state: 'CA', market: 'San Diego', rsn: 'Padres.TV (ESPN)', rsnNote: 'Direct-to-consumer via ESPN app', league: 'NL', division: 'West', record: '0-0' },
  'San Francisco Giants': { city: 'San Francisco', state: 'CA', market: 'Bay Area', rsn: 'NBC Sports Bay Area', rsnNote: 'Comcast regional network', league: 'NL', division: 'West', record: '0-0' },
  'Seattle Mariners': { city: 'Seattle', state: 'WA', market: 'Seattle/Pacific NW', rsn: 'Mariners.TV (MLB Local)', rsnNote: 'MLB Local Media production', league: 'AL', division: 'West', record: '0-0' },
  'St. Louis Cardinals': { city: 'St. Louis', state: 'MO', market: 'St. Louis', rsn: 'Bally Sports Midwest', rsnNote: 'FanDuel Sports Network status uncertain', league: 'NL', division: 'Central', record: '0-0' },
  'Tampa Bay Rays': { city: 'Tampa Bay', state: 'FL', market: 'Tampa Bay', rsn: 'Bally Sports Sun', rsnNote: 'Available on Bally Sports+', league: 'AL', division: 'East', record: '0-0' },
  'Texas Rangers': { city: 'Dallas', state: 'TX', market: 'Dallas-Fort Worth', rsn: 'Bally Sports Southwest', rsnNote: 'Available on Bally Sports+', league: 'AL', division: 'West', record: '0-0' },
  'Toronto Blue Jays': { city: 'Toronto', state: 'ON', market: 'Canada', rsn: 'Sportsnet', rsnNote: 'Rogers-owned, national coverage in Canada', league: 'AL', division: 'East', record: '0-0' },
  'Washington Nationals': { city: 'Washington', state: 'DC', market: 'Washington DC', rsn: 'Nationals.TV (MLB Local)', rsnNote: 'MLB Local Media takeover Jan 2026', league: 'NL', division: 'East', record: '0-0' },
};
