import React from 'react';
import './MobileContainer.css';

const MobileContainer = ({ children }) => {
  return (
    <div className="mobile-window">
      <div className="mobile-content">
        {children}
        <div id="live2d-global-host" className="live2d-global-host" aria-hidden="true" />
      </div>
    </div>
  );
};

export default MobileContainer;
