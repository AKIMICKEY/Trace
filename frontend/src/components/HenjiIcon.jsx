import React from 'react';
import iconImage from '../assets/痕迹.png';

const HenjiIcon = ({ size = 64, className = '' }) => {
  return (
    <img 
      src={iconImage} 
      alt="痕迹" 
      width={size} 
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default HenjiIcon;

export const henjiColors = {
  primary: '#333333',
  primaryDark: '#1a1a1a',
  background: '#f5f5f5',
  backgroundGradient: 'linear-gradient(135deg, #f5f5f5 0%, #d0d0d0 50%, #a0a0a0 100%)',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
};
