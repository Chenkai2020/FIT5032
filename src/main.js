import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'


import { initializeApp, getApps } from 'firebase/app'


const firebaseConfig = {
  apiKey: "AIzaSyAxyw3q66gT8-1t4mBJf4TF1bTCrJGblRs",
  authDomain: "week7-chenkaidou.firebaseapp.com",
  projectId: "week7-chenkaidou",
  storageBucket: "week7-chenkaidou.firebasestorage.app",
  messagingSenderId: "136745412739",
  appId: "1:136745412739:web:16e4cfc862d3d5b542d3b6"
};


if (!getApps().length) initializeApp(firebaseConfig)


createApp(App).use(router).mount('#app')