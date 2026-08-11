'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMediaDevices() {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [permissionState, setPermissionState] = useState({ camera: 'prompt', microphone: 'prompt' });
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const enumerateDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: deviceList.filter((d) => d.kind === 'videoinput'),
        microphones: deviceList.filter((d) => d.kind === 'audioinput'),
      });
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
    }
  }, []);

  const requestAccess = useCallback(async (videoDeviceId, audioDeviceId) => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Media devices are not supported by this browser.');
      }

      const preferredConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      };
      let mediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      } catch (initialError) {
        if (initialError.name !== 'NotFoundError' && initialError.name !== 'OverconstrainedError') {
          throw initialError;
        }

        // Some computers have only a camera or only a microphone. Allow either
        // device so a missing track does not block the complete live preview.
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (videoError) {
          if (videoError.name === 'NotAllowedError') throw videoError;
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      const hasCamera = mediaStream.getVideoTracks().length > 0;
      const hasMicrophone = mediaStream.getAudioTracks().length > 0;
      setCameraEnabled(hasCamera);
      setMicrophoneEnabled(hasMicrophone);
      setPermissionState({
        camera: hasCamera ? 'granted' : 'unavailable',
        microphone: hasMicrophone ? 'granted' : 'unavailable',
      });

      await enumerateDevices();
      return mediaStream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissionState({ camera: 'denied', microphone: 'denied' });
        setError('Camera/microphone access was denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device.');
      } else {
        setError(err.message || 'Failed to access camera/microphone. Please try again.');
      }
      return null;
    }
  }, [enumerateDevices]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicrophoneEnabled(audioTrack.enabled);
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const settings = videoTrack.getSettings();
      const newFacing = settings.facingMode === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      streamRef.current.removeTrack(videoTrack);
      streamRef.current.addTrack(newVideoTrack);
      videoTrack.stop();

      setStream(new MediaStream([...streamRef.current.getTracks()]));
    } catch (err) {
      console.warn('Failed to switch camera:', err);
    }
  }, []);

  const switchMicrophone = useCallback(async (deviceId) => {
    if (!streamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: deviceId } },
      });

      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = streamRef.current.getAudioTracks()[0];
      if (oldAudioTrack) {
        streamRef.current.removeTrack(oldAudioTrack);
        oldAudioTrack.stop();
      }
      streamRef.current.addTrack(newAudioTrack);
      setSelectedMicrophone(deviceId);

      setStream(new MediaStream([...streamRef.current.getTracks()]));
    } catch (err) {
      console.warn('Failed to switch microphone:', err);
    }
  }, []);

  useEffect(() => {
    enumerateDevices();
    return () => stopStream();
  }, [enumerateDevices, stopStream]);

  return {
    stream,
    devices,
    selectedCamera,
    selectedMicrophone,
    cameraEnabled,
    microphoneEnabled,
    permissionState,
    error,
    setSelectedCamera,
    setSelectedMicrophone,
    requestAccess,
    stopStream,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    switchMicrophone,
    enumerateDevices,
  };
}
