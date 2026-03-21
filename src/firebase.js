import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzskVncJel9eHc_N6fk_0s-Ey-nHDpUi4",
  authDomain: "forex-journal-b3db8.firebaseapp.com",
  projectId: "forex-journal-b3db8",
  storageBucket: "forex-journal-b3db8.firebasestorage.app",
  messagingSenderId: "241643053035",
  appId: "1:241643053035:web:96978dddc6890ff1f7c3ae",
  measurementId: "G-NC3JX0485E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
