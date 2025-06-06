import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = ({ message, type, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className={`notification ${type}`}>
      {message}
      <button onClick={() => { setVisible(false); if (onDismiss) onDismiss(); }} className="dismiss-btn">&times;</button>
    </div>
  );
};
export default Notification;
