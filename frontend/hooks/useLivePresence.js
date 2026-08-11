'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useLivePresence(streamId) {
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [viewers, setViewers] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!streamId) return;

    const channel = supabase.channel(`live-viewers-${streamId}`, {
      config: { presence: { key: streamId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const keys = Object.keys(state);
        const count = keys.length;
        setViewerCount(count);
        setPeakViewerCount((prev) => Math.max(prev, count));

        const allViewers = [];
        keys.forEach((key) => {
          const presences = state[key];
          presences.forEach((p) => {
            allViewers.push(p);
          });
        });
        setViewers(allViewers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          await channel.track({
            user_id: user?.id || 'anonymous',
            username: user?.email?.split('@')[0] || 'Viewer',
            joined_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [streamId]);

  const trackPeak = useCallback((count) => {
    setPeakViewerCount((prev) => Math.max(prev, count));
  }, []);

  return { viewerCount, peakViewerCount, viewers, trackPeak };
}
