import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for handling keyboard shortcuts
 * @param {Object} options - Configuration options
 * @param {Function} options.onSearch - Callback for search action (Ctrl+K or /)
 * @param {Function} options.onCreate - Callback for create action (Alt+C)
 * @param {Function} options.onEdit - Callback for edit action (Alt+E)
 * @param {Function} options.onSettings - Callback for settings action (Alt+S)
 * @param {Function} options.onHelp - Callback for help action (?)
 * @param {boolean} options.enableCreate - Enable create shortcut
 * @param {boolean} options.enableEdit - Enable edit shortcut
 * @param {string} options.userType - User type for context-aware shortcuts
 */
export const useKeyboardShortcuts = ({
  onSearch,
  onCreate,
  onEdit,
  onSettings,
  onHelp,
  enableCreate = false,
  enableEdit = false,
  userType = null,
} = {}) => {
  const navigate = useNavigate();
  const [sequenceKey, setSequenceKey] = useState(null);

  const handleKeyPress = useCallback((e) => {
    // Ignore if user is typing in an input/textarea/select
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      return;
    }

    // Ignore if contentEditable
    if (e.target.isContentEditable) {
      return;
    }

    const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

    // === SEQUENCE SHORTCUTS (G + ...) ===
    if (sequenceKey === 'g') {
      e.preventDefault();
      setSequenceKey(null);

      switch (e.key.toLowerCase()) {
        case 'd':
          navigate('/dashboard');
          break;
        case 'f':
          navigate('/feed');
          break;
        case 'e':
          navigate('/explore');
          break;
        case 'b':
          // Go back to previous page
          navigate(-1);
          break;
        case 'c':
          // Go to courses based on user type
          if (userType === 'lecturer') {
            navigate('/lecturer/courses');
          } else if (userType === 'student') {
            navigate('/student/courses');
          }
          break;
        case 's':
          // Go to schedule based on user type
          if (userType === 'lecturer') {
            navigate('/lecturer/schedule');
          } else if (userType === 'student') {
            navigate('/student/schedule');
          } else if (userType === 'institution') {
            navigate('/dashboard/settings');
          }
          break;
        default:
          // Invalid sequence, do nothing
          break;
      }
      return;
    }

    // === SINGLE KEY SHORTCUTS (no modifier) ===
    if (!hasModifier) {
      // G: Start sequence
      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setSequenceKey('g');
        // Clear sequence after 1.5 seconds if no second key pressed
        setTimeout(() => setSequenceKey(null), 1500);
        return;
      }

      // ?: Show help
      if (e.key === '?') {
        e.preventDefault();
        onHelp?.();
        return;
      }

      // /: Focus search
      if (e.key === '/') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Escape: Close modals (handled by modal components, but we can still trigger callback)
      if (e.key === 'Escape') {
        setSequenceKey(null); // Clear any sequence
        // Let modal components handle this naturally
        return;
      }
    }

    // === CTRL/CMD SHORTCUTS ===
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + K: Search
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch?.();
        return;
      }
    }

    // === SHIFT SHORTCUTS ===
    if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Shift + C: Create
      if (e.key.toLowerCase() === 'c' && enableCreate) {
        e.preventDefault();
        onCreate?.();
        return;
      }

      // Shift + E: Edit
      if (e.key.toLowerCase() === 'e' && enableEdit) {
        e.preventDefault();
        onEdit?.();
        return;
      }

      // Shift + S: Settings
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSettings?.();
        return;
      }
    }
  }, [onSearch, onCreate, onEdit, onSettings, onHelp, enableCreate, enableEdit, navigate, userType, sequenceKey]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return { sequenceKey };
};

