'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  createStream,
  startStream,
  endStream,
  cancelStream,
  getStreamById,
  joinStreamAsViewer,
  leaveStreamAsViewer,
  sendLiveNotification,
  saveLiveReplay,
} from '../lib/live/liveService';
import {
  startLocalCamera,
  stopLocalCamera,
  createBroadcastPeerConnection,
  createBroadcastOffer,
  handleBroadcastAnswer,
  handleBroadcastIceCandidate,
  removeBroadcastPeerConnection,
  cleanupBroadcast,
  setBroadcastChannel,
  getLocalStream,
} from '../lib/live/streamingProvider';

export function useLiveStream() {
  const [stream, setStream] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const channelRef = useRef(null);
  const durationTimerRef = useRef(null);
  const viewerPeersRef = useRef(new Map());
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);

  const beginRecording = useCallback((mediaStream) => {
    if (!mediaStream?.getTracks().length || typeof MediaRecorder === 'undefined') return false;
    const hasVideo = mediaStream.getVideoTracks().length > 0;
    const supportedType = (hasVideo
      ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['audio/webm;codecs=opus', 'audio/webm']
    ).find((type) => MediaRecorder.isTypeSupported(type));
    let recorder;
    try {
      recorder = new MediaRecorder(mediaStream, supportedType ? { mimeType: supportedType } : undefined);
    } catch (err) {
      console.warn('This browser cannot record the live stream:', err);
      return false;
    }
    recordingChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) recordingChunksRef.current.push(event.data);
    };
    // A short timeslice ensures even very short broadcasts produce a chunk.
    recorder.start(250);
    recorderRef.current = recorder;
    return true;
  }, []);

  const finishRecording = useCallback(() => new Promise((resolve) => {
    const recorder = recorderRef.current;
    const createBlob = () => recordingChunksRef.current.length
      ? new Blob(recordingChunksRef.current, { type: recorder?.mimeType || 'video/webm' })
      : null;

    if (!recorder) {
      resolve(createBlob());
      return;
    }
    if (recorder.state === 'inactive') {
      const blob = createBlob();
      recorderRef.current = null;
      recordingChunksRef.current = [];
      resolve(blob);
      return;
    }
    recorder.addEventListener('stop', () => {
      const blob = createBlob();
      recorderRef.current = null;
      recordingChunksRef.current = [];
      resolve(blob);
    }, { once: true });
    // Flush the current buffer before stopping. Chrome then emits the final
    // dataavailable event before the stop event.
    try { recorder.requestData(); } catch (_) {}
    recorder.stop();
  }), []);

  const startBroadcasting = useCallback(async (streamData, mediaDevices) => {
    let createdStream = null;
    try {
      setStatus('starting');
      setError(null);

      const newStream = await createStream(streamData);
      createdStream = newStream;
      setStream(newStream);

      const camStream = mediaDevices.stream || await startLocalCamera();
      if (!camStream) throw new Error('Failed to access camera');
      setLocalStream(camStream);

      await startStream(newStream.id);
      beginRecording(camStream);

      const channel = supabase.channel(`live-broadcast-${newStream.id}`, {
        config: { presence: { key: newStream.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {})
        .on('broadcast', { event: 'viewer-join' }, async (payload) => {
          const viewerId = payload.payload.viewerId;
          const pc = createBroadcastPeerConnection(viewerId, () => {});
          const offer = await createBroadcastOffer(viewerId);
          if (offer) {
            channel.send({
              type: 'broadcast',
              event: 'stream-offer',
              payload: { offer, viewerId },
            });
          }
        })
        .on('broadcast', { event: 'viewer-answer' }, async (payload) => {
          const { viewerId, answer } = payload.payload;
          await handleBroadcastAnswer(viewerId, answer);
        })
        .on('broadcast', { event: 'viewer-ice' }, async (payload) => {
          const { viewerId, candidate } = payload.payload;
          await handleBroadcastIceCandidate(viewerId, candidate);
        })
        .on('broadcast', { event: 'viewer-leave' }, (payload) => {
          removeBroadcastPeerConnection(payload.payload.viewerId);
        })
        .subscribe(async (subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            const { data: { user } } = await supabase.auth.getUser();
            await channel.track({
              user_id: user?.id,
              role: 'broadcaster',
              stream_id: newStream.id,
            });
            setBroadcastChannel(channel);

            const username = user?.email?.split('@')[0] || 'Someone';
            sendLiveNotification(newStream.id, username).catch(() => {});
          }
        });

      channelRef.current = channel;
      setIsBroadcasting(true);
      setStatus('live');

      durationTimerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      await finishRecording();
      if (createdStream?.id) {
        try { await cancelStream(createdStream.id); } catch (cleanupError) { console.warn(cleanupError); }
      }
      setError(err.message || 'Failed to start live stream');
      setStatus('error');
      throw err;
    }
  }, [beginRecording, finishRecording]);

  const stopBroadcasting = useCallback(async () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    const recording = await finishRecording();

    let replay = null;
    let replayError = null;
    if (stream) {
      try { await endStream(stream.id); } catch (err) { console.warn(err); }
      if (recording?.size) {
        try { replay = await saveLiveReplay(stream, recording); } catch (err) {
          replayError = err;
          console.warn('Failed to save live replay:', err);
        }
      } else {
        replayError = new Error('No video recording was captured');
      }
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    cleanupBroadcast();
    viewerPeersRef.current.forEach((pc) => pc.close());
    viewerPeersRef.current.clear();

    setLocalStream(null);
    setStream(null);
    setIsBroadcasting(false);
    setStatus('ended');
    setDuration(0);
    return { replay, replayError };
  }, [stream, finishRecording]);

  const cancelBroadcast = useCallback(async () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    await finishRecording();

    if (stream) {
      try { await cancelStream(stream.id); } catch (err) { console.warn(err); }
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    cleanupBroadcast();
    viewerPeersRef.current.forEach((pc) => pc.close());
    viewerPeersRef.current.clear();

    setLocalStream(null);
    setStream(null);
    setIsBroadcasting(false);
    setStatus('idle');
    setDuration(0);
  }, [stream, finishRecording]);

  const joinStream = useCallback(async (streamId) => {
    try {
      setStatus('joining');
      setError(null);

      const streamData = await getStreamById(streamId);
      setStream(streamData);

      await joinStreamAsViewer(streamId);

      const channel = supabase.channel(`live-viewer-${streamId}`, {
        config: { presence: { key: streamId } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {})
        .on('broadcast', { event: 'stream-offer' }, async (payload) => {
          if (payload.payload.viewerId !== (await supabase.auth.getUser()).data.user?.id) return;
        })
        .subscribe(async (subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            const { data: { user } } = await supabase.auth.getUser();
            await channel.track({
              user_id: user?.id,
              role: 'viewer',
              stream_id: streamId,
            });

            channel.send({
              type: 'broadcast',
              event: 'viewer-join',
              payload: { viewerId: user?.id },
            });
          }
        });

      channelRef.current = channel;
      setIsViewing(true);
      setStatus('viewing');
    } catch (err) {
      setError(err.message || 'Failed to join stream');
      setStatus('error');
      throw err;
    }
  }, []);

  const leaveStream = useCallback(async (streamId) => {
    if (channelRef.current) {
      const { data: { user } } = await supabase.auth.getUser();
      channelRef.current.send({
        type: 'broadcast',
        event: 'viewer-leave',
        payload: { viewerId: user?.id },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (streamId) {
      try { await leaveStreamAsViewer(streamId); } catch (err) { console.warn(err); }
    }

    viewerPeersRef.current.forEach((pc) => pc.close());
    viewerPeersRef.current.clear();

    setRemoteStream(null);
    setIsViewing(false);
    setStatus('idle');
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }, [localStream]);

  const toggleMicrophone = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }, [localStream]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      cleanupBroadcast();
    };
  }, []);

  return {
    stream,
    isBroadcasting,
    isViewing,
    localStream,
    remoteStream,
    setRemoteStream,
    status,
    error,
    duration,
    startBroadcasting,
    stopBroadcasting,
    cancelBroadcast,
    joinStream,
    leaveStream,
    toggleCamera,
    toggleMicrophone,
  };
}
