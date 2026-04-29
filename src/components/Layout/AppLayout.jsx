import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';

const HIDE_FOOTER_PATHS = ['/opening', '/study', '/dialogue', '/character-select', '/story', '/relationship-events', '/multiplayer-match', '/review', '/missions', '/missions-v0', '/writing', '/expression-preview', '/custom-vocab/flashcards'];

const matchesRoutePrefix = (pathname, routePrefix) =>
  pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);

const AppLayout = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const isTitlePage = pathname === '/';
  const isReviewRoute = matchesRoutePrefix(pathname, '/review');
  const isImmersiveScene = ['/multiplayer-match'].some((path) =>
    matchesRoutePrefix(pathname, path),
  );
  const shouldHideFooter =
    isTitlePage || HIDE_FOOTER_PATHS.some((path) => matchesRoutePrefix(pathname, path));

  useEffect(() => {
    if (isReviewRoute) {
      document.body.classList.add('review-route-active');
      return () => {
        document.body.classList.remove('review-route-active');
      };
    }

    document.body.classList.remove('review-route-active');
    return undefined;
  }, [isReviewRoute]);

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
