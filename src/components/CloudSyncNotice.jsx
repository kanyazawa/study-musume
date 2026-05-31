import React from 'react';
import './CloudSyncNotice.css';

const CloudSyncNotice = ({ notice }) => {
  if (!notice?.visible || !notice?.message) {
    return null;
  }

  const statusClassName = notice.status ? `is-${notice.status}` : 'is-idle';
  const role = notice.status === 'error' ? 'alert' : 'status';

  return (
    <div className={`cloud-sync-notice ${statusClassName}`} role={role} aria-live="polite">
      <span className="cloud-sync-notice__dot" aria-hidden="true" />
      <span className="cloud-sync-notice__message">{notice.message}</span>
    </div>
  );
};

export default CloudSyncNotice;
