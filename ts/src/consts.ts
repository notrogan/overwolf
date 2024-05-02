export const kGamesFeatures = new Map<number, string[]>([
  // Rainbow Six Siege
  [
    10826,
    [
      'game_info',
      'match',
      'match_info',
      'roster',
      'kill',
      'death',
      'me',
      'defuser'
    ]
  ],
]);

export const kGameClassIds = Array.from(kGamesFeatures.keys());

export const kWindowNames = {
  inGame: 'in_game',
  desktop: 'desktop'
};

export const kHotkeys = {
  toggle: 'sample_app_ts_showhide'
};
