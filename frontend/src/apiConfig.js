const PRODUCTION_URL = 'https://wapipulse.com';

// If we're on a native platform (Android/iOS), we must use the full URL.
// We check for 'Capacitor' global or just use a build-time flag.
const isNative = window.Capacitor?.isNativePlatform();

const API_URL = isNative ? PRODUCTION_URL : '';

export default API_URL;
