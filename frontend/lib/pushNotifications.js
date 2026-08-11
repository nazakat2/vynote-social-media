'use client';
import { supabase } from './supabase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export async function subscribeToPush() {
  try {
    const permission = await requestNotificationPermission();
    if (!permission) return null;

    const registration = await registerServiceWorker();
    if (!registration) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY ? urlBase64ToUint8Array(VAPID_KEY) : undefined
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('push_tokens').upsert({
        user_id: user.id,
        token: JSON.stringify(subscription),
        platform: 'web',
        is_active: true
      }, { onConflict: 'user_id,token' });
    }

    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('token', JSON.stringify(subscription));
      }
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

export function onPushMessage(callback) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_MESSAGE') {
      callback(event.data.payload);
    }
  });
}
