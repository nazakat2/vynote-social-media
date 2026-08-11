const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function createPeerConnection(onTrack, onIceCandidate, onConnectionStateChange) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.ontrack = onTrack;
  pc.onicecandidate = onIceCandidate;
  pc.onconnectionstatechange = onConnectionStateChange;

  return pc;
}

export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return pc.localDescription;
}

export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return pc.localDescription;
}

export async function handleOffer(pc, offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
}

export async function handleAnswer(pc, answer) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(pc, candidate) {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export function addLocalTracks(pc, stream) {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

export function closeConnection(pc) {
  if (pc) {
    pc.close();
  }
}

export function getLocalDescription(pc) {
  return pc.localDescription ? {
    sdp: pc.localDescription.sdp,
    type: pc.localDescription.type,
  } : null;
}
