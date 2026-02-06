import React from 'react';
import './MobileContainer.css';

const MobileContainer = ({ children }) => {
  return (
    <div className="mobile-window">
      <div className="mobile-content">
        {children}
      </div>
    </div>
  );
};

export default MobileContainer;
