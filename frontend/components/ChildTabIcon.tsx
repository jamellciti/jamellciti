import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface ChildTabIconProps {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  size?: number;
}

export const ChildTabIcon: React.FC<ChildTabIconProps> = ({ name, color, size = 28 }) => {
  return <MaterialIcons name={name} size={size} color={color} />;
};