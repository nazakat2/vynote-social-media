import {
  createPeerConnection,
  createOffer,
  handleOffer,
  handleAnswer,
  addIceCandidate,
  addLocalTracks,
  closeConnection,
} from './webrtc';

let localStream = null;
let peerConnections = new Map();
let broadcastChannel = null;

export async function startLocalCamera(videoDeviceId, audioDeviceId) {
  const constraints = {
    video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
  };

  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Camera/microphone access was denied. Please allow access in your browser settings.');
    }
    if (err.name === 'NotFoundError') {
      throw new Error('No camera or microphone found. Please connect a device.');
    }
    throw new Error('Failed to access camera/microphone. Please try again.');
  }
}

export function stopLocalCamera() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
}

export function toggleCamera() {
  if (!localStream) return false;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    return videoTrack.enabled;
  }
  return false;
}

export function toggleMicrophone() {
  if (!localStream) return false;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    return audioTrack.enabled;
  }
  return false;
}

export async function switchCamera() {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  const settings = videoTrack.getSettings();
  const newFacing = settings.facingMode === 'user' ? 'environment' : 'user';

  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: newFacing },
    audio: false,
  });

  const newVideoTrack = newStream.getVideoTracks()[0];
  localStream.removeTrack(videoTrack);
  localStream.addTrack(newVideoTrack);
  videoTrack.stop();

  peerConnections.forEach((pc) => {
    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) sender.replaceTrack(newVideoTrack);
  });
}

export async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter((d) => d.kind === 'videoinput'),
    microphones: devices.filter((d) => d.kind === 'audioinput'),
  };
}

export function getLocalStream() {
  return localStream;
}

export function createBroadcastPeerConnection(viewerId, onRemoteTrack) {
  const pc = createPeerConnection(
    (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteTrack(event.streams[0]);
      }
    },
    (event) => {
      if (event.candidate) {
        broadcastChannel?.send({
          type: 'ice-candidate',
          payload: { candidate: event.candidate, targetId: viewerId },
        });
      }
    },
    () => {}
  );

  if (localStream) {
    addLocalTracks(pc, localStream);
  }

  peerConnections.set(viewerId, pc);
  return pc;
}

export async function createBroadcastOffer(viewerId) {
  const pc = peerConnections.get(viewerId);
  if (!pc) return null;
  const offer = await createOffer(pc);
  return { sdp: offer.sdp, type: offer.type };
}

export async function handleBroadcastAnswer(viewerId, answer) {
  const pc = peerConnections.get(viewerId);
  if (!pc) return;
  await handleAnswer(pc, answer);
}

export async function handleBroadcastIceCandidate(viewerId, candidate) {
  const pc = peerConnections.get(viewerId);
  if (!pc) return;
  await addIceCandidate(pc, candidate);
}

export function removeBroadcastPeerConnection(viewerId) {
  const pc = peerConnections.get(viewerId);
  if (pc) {
    closeConnection(pc);
    peerConnections.delete(viewerId);
  }
}

export function setBroadcastChannel(channel) {
  broadcastChannel = channel;
}

export function cleanupBroadcast() {
  peerConnections.forEach((pc) => closeConnection(pc));
  peerConnections.clear();
  broadcastChannel = null;
  stopLocalCamera();
}

export async function createViewerPeerConnection(streamId, onRemoteTrack, onIceCandidateCallback) {
  const pc = createPeerConnection(
    (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteTrack(event.streams[0]);
      }
    },
    (event) => {
      if (event.candidate) {
        onIceCandidateCallback(event.candidate);
      }
    },
    () => {}
  );

  return pc;
}

export async function joinAsViewer(pc, offer) {
  await handleOffer(pc, offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return { sdp: pc.localDescription.sdp, type: pc.localDescription.type };
}

export function cleanupViewer(pc) {
  closeConnection(pc);
}
