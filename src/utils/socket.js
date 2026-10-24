import { io } from 'socket.io-client';

// Determine backend URL dynamically:
// In Vite dev (port 5173), direct connect to backend port 3001 using the same hostname/LAN IP
// In production, connect to custom backend if provided via query/env/localStorage, or origin.
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const customServer = urlParams?.get('server') || (typeof localStorage !== 'undefined' && localStorage.getItem('monkeyracer_backend'));

const isDev = typeof window !== 'undefined' && window.location.port === '5173';
const SERVER_URL = customServer || import.meta.env.VITE_SERVER_URL || (isDev
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : window.location.origin);

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export function getRoomShareUrl(roomId, lanIp, port) {
  // If host is running on LAN, use LAN IP so phones on the same Wi-Fi can scan and open
  const host = (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1')
    ? `${lanIp}:${window.location.port || port || 3001}`
    : window.location.host;
  
  let pathname = window.location.pathname || '/';
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }
  
  return `${window.location.protocol}//${host}${pathname}?room=${encodeURIComponent(roomId)}`;
}
