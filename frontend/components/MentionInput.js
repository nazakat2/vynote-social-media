'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function MentionInput({ value, onChange, onSubmit, placeholder, style }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.length >= 1) {
      searchUsers(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (q) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${q}%`)
      .limit(5);
    if (data) {
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      setSelectedIndex(0);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && showSuggestions) {
        e.preventDefault();
        selectUser(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = text.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ') || afterAt.split(' ').length <= 2) {
        setQuery(afterAt);
        return;
      }
    }
    setQuery('');
    onChange?.(e);
  };

  const selectUser = (user) => {
    const text = value || '';
    const lastAtIndex = text.lastIndexOf('@');
    const beforeAt = text.slice(0, lastAtIndex);
    const newText = `${beforeAt}@${user.username} `;
    onChange?.({ target: { value: newText } });
    setShowSuggestions(false);
    setQuery('');
    inputRef.current?.focus();
  };

  const highlightMentions = (text) => {
    if (!text) return text;
    return text.replace(/@(\w+)/g, '<span style="color:#ff2442;font-weight:600">@$1</span>');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder || 'Write a comment... @ to mention'}
          style={{ width: '100%', height: 40, borderRadius: 20, border: '1px solid var(--line, #f0f0f0)', background: 'var(--input-bg, #f5f5f7)', color: 'var(--ink)', padding: '0 16px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: 'var(--card-bg, #fff)', border: '1px solid var(--line, #f0f0f0)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.15)', maxHeight: 200, overflowY: 'auto', zIndex: 100 }}>
          {suggestions.map((user, i) => (
            <div
              key={user.id}
              onClick={() => selectUser(user)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: i === selectedIndex ? 'var(--input-bg, #f0f0f0)' : 'transparent', transition: 'background .15s' }}
            >
              <img src={user.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{user.display_name || user.username}</div>
                <div style={{ fontSize: 12, color: 'var(--sub, #888)' }}>@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function parseMentions(text) {
  if (!text) return text;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return `<span style="color:#ff2442;font-weight:600">${part}</span>`;
    }
    return part;
  }).join('');
}
