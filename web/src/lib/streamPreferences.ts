export interface StreamPreferences {
  resolutionOrder: string[];   // e.g. ['4K', '1080P', '720P', '480P', '360P']
  codecOrder: string[];        // e.g. ['HEVC', 'AV1', 'AVC']
  qualityOrder: string[];      // e.g. ['Bluray REMUX', 'WEB-DL', 'Bluray', 'WEBRip']
  hdrPreference: 'prefer' | 'exclude' | 'any';
  typeOrder: string[];         // e.g. ['debrid', 'p2p', 'http']
  maxSizeGB: number | null;
  minSeeders: number | null;
}

export const DEFAULT_PREFERENCES: StreamPreferences = {
  resolutionOrder: ['1080P', '720P', '4K', '480P', '360P', '?'],
  codecOrder: ['HEVC', 'AV1', 'AVC'],
  qualityOrder: ['Bluray REMUX', 'Bluray', 'WEB-DL', 'WEBRip', 'HDRip', 'HC HD-Rip', 'DVDRip', 'HDTV', 'CAM', 'TS', 'TC', 'SCR'],
  hdrPreference: 'any',
  typeOrder: ['debrid', 'p2p', 'http'],
  maxSizeGB: null,
  minSeeders: null,
};
