import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

export default function AutoLogout() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      toast.error('Logged out due to inactivity', { id: 'auto-logout' });
      navigate('/login');
    }
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
  }, [handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Initial start
    resetTimer();

    // Event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return null; // This component doesn't render anything
}
