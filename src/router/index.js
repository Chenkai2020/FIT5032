import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventsRegistration from '@/views/EventsRegistration.vue'   // ← 用报名页作为 /events
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'
import AdminView from '@/views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',               name: 'home',         component: HomeView },
    { path: '/events',         name: 'events',       component: EventsRegistration }, // ← 改这里
    { path: '/FireLogin',      name: 'FireLogin',    component: FirebaseSigninView },
    { path: '/FireRegister',   name: 'FireRegister', component: FirebaseRegisterView },
    { path: '/admin',          name: 'admin',        component: AdminView,
      meta: { requiresAuth: true, roles: ['admin'] } },

    // 容错 & 兜底
    { path: '/Firelogin',   redirect: { name: 'FireLogin' } },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// ====== 角色守卫（进入受限路由时现查 Firestore 的 users/{uid}.role） ======
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getApp } from 'firebase/app'

function waitForAuthUser() {
  const auth = getAuth()
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, user => { stop(); resolve(user) })
  })
}

router.beforeEach(async (to, from, next) => {
  if (to.meta?.requiresAuth) {
    const user = await waitForAuthUser()
    if (!user) return next({ name: 'FireLogin' })
  }

  if (to.meta?.roles?.length) {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return next({ name: 'FireLogin' })

    try {
      const db = getFirestore(getApp())
      const snap = await getDoc(doc(db, 'users', user.uid))
      const role = snap.exists() ? (snap.data().role || 'member') : 'member'
      if (!to.meta.roles.includes(role)) return next({ name: 'home' })
    } catch (_) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router