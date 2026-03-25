import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';

const HIDE_FOOTER_PATHS = ['/study', '/dialogue', '/character-select', '/story', '/multiplayer-match', '/review'];

const matchesRoutePrefix = (pathname, routePrefix) =>
  pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);

const AppLayout = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const isTitlePage = pathname === '/';
  const isImmersiveScene = ['/review', '/multiplayer-match'].some((path) =>
    matchesRoutePrefix(pathname, path),
  );
  const shouldHideFooter =
    isTitlePage || HIDE_FOOTER_PATHS.some((path) => matchesRoutePrefix(pathname, path));

  return (
    <>
      <div
        className="content-container fadeIn"
        style={{
          flex: 1,
          overflowY: isImmersiveScene ? 'hidden' : 'auto',
          overflowX: 'hidden',
        }}
        key={pathname}
      >
        {children}
      </div>
      {!shouldHideFooter && <Footer />}
    </>
  );
};

export default AppLayout;
