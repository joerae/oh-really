export interface VersionHistoryEntry {
  version: string;
  desc: string;
}

export const versionHistory: VersionHistoryEntry[] = [
  { version: '1.0', desc: 'Initial release of Oh Really???' },
  { version: '1.1', desc: 'Added charitable interpretation to claim analysis' },
  { version: '1.2', desc: 'Implemented clickable source links and fallback search' },
  { version: '1.3', desc: 'Added 60s progress bar for deep research' },
  { version: '1.4', desc: 'Redesigned skepticism meter and result layout' },
  { version: '1.5', desc: 'Added footer credits and version tracker' },
  { version: '1.6', desc: 'Defaulted Search grounding off, exposed Gemini errors, and tightened evidence links' },
  { version: '1.7', desc: 'Hid Search grounding behind a feature flag and restored Learn more evidence searches' },
  { version: '1.8', desc: 'Separated and refined the fact-check prompt for clearer evidence sourcing' },
  { version: '1.9', desc: 'Optimized fact checks for non-grounded Gemini responses and removed invented sources' },
  { version: '1.10', desc: 'Added suggested claims and stabilized the loading progress layout' },
  { version: '1.11', desc: 'Moved version history into its own file and added a code decision log' },
  { version: '1.12', desc: 'Changed suggested checks into claims and restored follow-up search links' },
  { version: '1.13', desc: 'Restored model-suggested search leads for non-grounded fact checks' },
  { version: '1.14', desc: 'Simplified search lead cards and hid opposite-side leads at score extremes' },
  { version: '1.15', desc: 'Improved analysis readability with paragraph-aware rendering' },
  { version: '1.16', desc: 'Clarified quota, unavailable API, and no-response errors' },
];
