import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCUoCrl4lm-eyYn6axfGBRPHmSVIv4AOlQ",
  authDomain: "socialchat-b6382.firebaseapp.com",
  projectId: "socialchat-b6382",
  storageBucket: "socialchat-b6382.firebasestorage.app",
  messagingSenderId: "753198655677",
  appId: "1:753198655677:web:942fc9658bfc05e69eafd4",
  measurementId: "G-JQ817X706H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging
let messaging: any = null;

const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.log('Firebase messaging not supported:', error);
  }
};

initializeMessaging();

export { messaging };

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Emulators not available, using production Firebase');
  }
}

// Enhanced notification service
export const NotificationService = {
  async initialize() {
    try {
      if (!messaging) return null;
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted for Firebase');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Firebase notifications:', error);
      return false;
    }
  },

  async getToken() {
    try {
      if (!messaging) return null;
      
      const token = await getToken(messaging, { 
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to add this from Firebase Console
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  onMessage(callback: (payload: any) => void) {
    if (!messaging) return () => {};
    
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  },

  async sendNotificationToUser(userId: string, title: string, body: string, data?: any) {
    try {
      console.log('Notification ready for Firebase backend integration:', {
        userId,
        title,
        body,
        data,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Notification prepared for Firebase backend integration'
      };
    } catch (error) {
      console.error('Error preparing notification:', error);
      return {
        success: false,
        error: error
      };
    }
  }
};

export default app;