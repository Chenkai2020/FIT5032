import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8DBUM8eWawI1HBtiCWntcKy8ViOkIUsM",
  authDomain: "fit5032-week6-79296.firebaseapp.com",
  projectId: "fit5032-week6-79296",
  storageBucket: "fit5032-week6-79296.firebasestorage.app",
  messagingSenderId: "539453928883",
  appId: "1:539453928883:web:ba60152175a8866ee947c6"
};



initializeApp(firebaseConfig);
const db = getFirestore()
export default db
