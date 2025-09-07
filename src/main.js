import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// ========= Firebase 初始化（务必在最前面完成） =========
import { initializeApp, getApps } from 'firebase/app'

// ← 用你现有的配置（你之前 main.js 里那份）
const firebaseConfig = {
  apiKey: "AIzaSyAxyw3q66gT8-1t4mBJf4TF1bTCrJGblRs",
  authDomain: "week7-chenkaidou.firebaseapp.com",
  projectId: "week7-chenkaidou",
  storageBucket: "week7-chenkaidou.firebasestorage.app",
  messagingSenderId: "136745412739",
  appId: "1:136745412739:web:16e4cfc862d3d5b542d3b6"
};

// 只初始化一次（热更新/多入口安全）
if (!getApps().length) initializeApp(firebaseConfig)

// ========= 挂载应用 =========
createApp(App).use(router).mount('#app')