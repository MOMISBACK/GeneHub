/**
 * TabIcons - Custom SVG icons for navigation tabs
 * Clean, minimal design matching the app's premium aesthetic
 */

import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

type TabIconProps = {
  size?: number;
  color?: string;
  focused?: boolean;
};

/**
 * DNA Icon - Double helix for Genes tab
 */
export function DnaIcon({ size = 24, color = '#000' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left strand */}
      <Path
        d="M6 3C6 3 6 5 8 7C10 9 10 11 10 12C10 13 10 15 8 17C6 19 6 21 6 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right strand */}
      <Path
        d="M18 3C18 3 18 5 16 7C14 9 14 11 14 12C14 13 14 15 16 17C18 19 18 21 18 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Horizontal connections */}
      <Path d="M7 5H17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M9 9H15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 12H14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M9 15H15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M7 19H17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * People Icon - Two figures for Researchers tab
 */
export function PeopleIcon({ size = 24, color = '#000' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Person 1 (front) */}
      <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Person 2 (back) */}
      <Circle cx="16" cy="6" r="2.5" stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M16 12C18.2091 12 20 13.7909 20 16V17"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Article Icon - Document with lines for Articles tab
 */
export function ArticleIcon({ size = 24, color = '#000' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Document outline */}
      <Path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Folded corner */}
      <Path
        d="M14 2V8H20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Text lines */}
      <Path d="M8 13H16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 17H13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Calendar Icon - Calendar grid for Conferences tab
 */
export function CalendarIcon({ size = 24, color = '#000' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar body */}
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Top hooks */}
      <Path d="M8 2V6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 2V6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Horizontal divider */}
      <Path d="M3 10H21" stroke={color} strokeWidth={1.5} />
      {/* Date dots */}
      <Circle cx="8" cy="15" r="1" fill={color} />
      <Circle cx="12" cy="15" r="1" fill={color} />
      <Circle cx="16" cy="15" r="1" fill={color} />
    </Svg>
  );
}

/**
 * Inbox Icon - Tray for Inbox tab
 */
export function InboxIcon({ size = 24, color = '#000' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Tray */}
      <Path
        d="M22 12H16L14 15H10L8 12H2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Box */}
      <Path
        d="M5.45 5.11L2 12V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V12L18.55 5.11C18.21 4.43 17.52 4 16.76 4H7.24C6.48 4 5.79 4.43 5.45 5.11Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Map of tab names to icon components
 */
export const TabIconMap = {
  Genes: DnaIcon,
  Researchers: PeopleIcon,
  Articles: ArticleIcon,
  Conferences: CalendarIcon,
  Inbox: InboxIcon,
} as const;

/**
 * Render a tab icon by name
 */
export function TabIcon({
  name,
  size = 22,
  color = '#000',
  focused = false,
}: {
  name: keyof typeof TabIconMap;
  size?: number;
  color?: string;
  focused?: boolean;
}) {
  const IconComponent = TabIconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} focused={focused} />;
}
