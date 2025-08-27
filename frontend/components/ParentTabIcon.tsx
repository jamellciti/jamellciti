import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface ParentTabIconProps {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  size?: number;
}

export const ParentTabIcon: React.FC<ParentTabIconProps> = ({ name, color, size = 24 }) => {
  return <MaterialIcons name={name} size={size} color={color} />;
};