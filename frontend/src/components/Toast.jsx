import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toastMessage } = useAuth();
  if (!toastMessage) return null;

  return (
    <div className="toast-notice">
      <span>{toastMessage}</span>
    </div>
  );
}
