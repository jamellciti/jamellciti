import type { EventType } from '../types';

export const EVENT_COLORS: Record<EventType, string> = {
  pothole: '#ff4d4f',           // red
  storm_drain_clog: '#1890ff',  // blue  
  litter_dumping: '#fadb14',    // yellow
  ada_obstruction: '#722ed1',   // purple
  near_miss: '#fa8c16',         // orange
  // New enforcement event types
  illegal_uturn: '#f5222d',     // dark red
  failure_to_yield: '#fa541c',  // red-orange
  reckless_merge: '#eb2f96',    // pink
  speeding_school_zone: '#ff7a45', // bright orange
};

export const EVENT_ICONS: Record<EventType, string> = {
  pothole: '🕳️',
  storm_drain_clog: '🌀',
  litter_dumping: '🗑️', 
  ada_obstruction: '♿',
  near_miss: '⚠️',
  // New enforcement icons
  illegal_uturn: '↩️',
  failure_to_yield: '🛑',
  reckless_merge: '🚗',
  speeding_school_zone: '🏫',
};

export const EVENT_LABELS: Record<EventType, string> = {
  pothole: 'POTHOLE',
  storm_drain_clog: 'STORM DRAIN',  
  litter_dumping: 'LITTER DUMPING',
  ada_obstruction: 'ADA OBSTRUCTION',
  near_miss: 'NEAR MISS',
  // New enforcement labels
  illegal_uturn: 'ILLEGAL U-TURN',
  failure_to_yield: 'FAILURE TO YIELD',
  reckless_merge: 'RECKLESS MERGE',
  speeding_school_zone: 'SCHOOL ZONE SPEEDING',
};

export const getEventColor = (type: EventType): string => {
  return EVENT_COLORS[type] || '#666666';
};

export const getEventIcon = (type: EventType): string => {
  return EVENT_ICONS[type] || '📍';
};

export const getEventLabel = (type: EventType): string => {
  return EVENT_LABELS[type] || type;
};