import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';

const HIDE_FOOTER_PATHS = ['/study', '/dialogue', '/character-select', '/story/', '/multiplayer-match'];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isTitlePage = location.pathname === '/';
  const shouldHideFooter =
    isTitlePage || HIDE_FOOTER_PATHS.some((path) => location.pathname.startsWith(path));

  return (
    <>
      <div
        className="content-container fadeIn"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        key={location.pathname}
      >
        {children}
      </div>
      {!shouldHideFooter && <Footer />}
    </>
  );
};

export default AppLayout;
