<template>
  <section class="container py-4" style="max-width:520px">
    <h2 class="mb-3">Firebase Login</h2>

    <form @submit.prevent="signin" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model.trim="email" type="email" class="form-control" required placeholder="you@example.com" />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" required minlength="6" placeholder="••••••" />
      </div>

      <button class="btn btn-primary w-100" :disabled="pending || !isValid">
        {{ pending ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="small mt-3 mb-0">
        No account?
        <router-link :to="{ name: 'FireRegister' }">Register here</router-link>
      </p>
    </form>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getApp } from 'firebase/app'

const auth = getAuth()
const db = getFirestore(getApp())
const router = useRouter()

const email = ref('')
const password = ref('')
const pending = ref(false)

const isValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) && (password.value?.length >= 6)
)

async function getRole(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? (snap.data().role || 'member') : 'member'
  } catch {
    return 'member'
  }
}

const signin = async () => {
  if (!isValid.value || pending.value) return
  pending.value = true
  try {
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    const role = await getRole(cred.user.uid)
    if (role === 'admin') router.push({ name: 'admin' })
    else router.push({ name: 'home' })
  } catch (err) {
    alert('Sign in failed: ' + (err.code || err.message))
  } finally {
    pending.value = false
  }
}


onMounted(async () => {
  const u = auth.currentUser
  if (u) {
    const role = await getRole(u.uid)
    if (role === 'admin') router.replace({ name: 'admin' })
  }
})
</script>