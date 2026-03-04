// Known-good constants from sessions.json and app.js

export const TOTAL_SESSIONS = 204;
export const DAY3_COUNT = 100;
export const DAY4_COUNT = 104;
export const DAY4_FIRST_INDEX = 100;

export const STAGE_ORDER = [
  'XPRO stage', 'XPRO Lab', 'XPRO Talks', 'Visionary Stage',
  'Hotspot Talks', 'Plug-in Talks', 'Focus Lab', 'Frontier lab',
  'Meetup area', 'Barcelona', 'Skills Hub', 'Robotics', 'Gaming',
];

export const ALL_TAGS = [
  'Artificial Intelligence', 'Cloud Computing', 'Cybersecurity',
  'Future Trends', 'GAMING', 'Management', 'ROBOTICS', 'Software Development',
];

export const ALL_LANGS = ['English', 'Spanish', 'Catalan'];

// Known sessions for targeted tests
export const SPANISH_SESSION_IDX = 0; // day 3, XPRO stage, Spanish
export const CATALAN_SESSION_IDX = 9; // day 3, Robotics, Catalan
export const NO_TAGS_SESSION_IDX = 7; // day 3, Frontier lab, no tags
export const EMPTY_LANG_SESSION_IDX = 63; // day 3, XPRO Lab, empty lang
export const GAMING_DAY4_IDX = 115; // day 4, Gaming stage

// localStorage keys (section-scoped, default section is "ta")
export const LS_HIDDEN = 'ta_hidden';
export const LS_HIGHLIGHTED = 'ta_highlighted';
export const LS_CAL_STAGES = 'ta_cal_stages';
export const LS_SHOW_HIDDEN = 'showHidden';
