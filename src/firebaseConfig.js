import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyD7EqMUFLJXvUVGUr-MlEJMrjSqxdDUnOU",
    authDomain: "scroller-4d10f.firebaseapp.com",
    databaseURL: "https://scroller-4d10f-default-rtdb.firebaseio.com",
    projectId: "scroller-4d10f",
    storageBucket: "scroller-4d10f.appspot.com",
    messagingSenderId: "1053362115345",
    appId: "1:1053362115345:web:d77e816012a643aa5a32b0",
    measurementId: "G-0GYZ8PD9LE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app); 