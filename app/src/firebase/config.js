let firebaseConfig = {};
try {
  // Prefer explicit EXPO_PUBLIC_* env vars (secure for publishing)
  if (process.env.EXPO_PUBLIC_FIREBASE_APIKEY) {
    firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGINGSENDERID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APPID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENTID
    };
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cfg = require('../../env/firebase-config.json');
      firebaseConfig = cfg || {};
    } catch (e) {
      console.warn('Firebase config not found in env/ and EXPO_PUBLIC_* vars are not set.');
      firebaseConfig = {};
    }
  }
}
catch (e) {
  // In some runtimes (e.g. Metro) process.env may be undefined — ensure we don't crash
  console.warn('Error loading firebase config:', e?.message || e);
  firebaseConfig = {};
}

export { firebaseConfig };

// Validate required Firebase configuration
const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    console.error(`Missing required Firebase configuration: ${key}`);
    console.error('Please set the following environment variables in your .env file:');
    console.error(`EXPO_PUBLIC_FIREBASE_${key.toUpperCase()}`);
  }
}