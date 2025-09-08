<template>
  <section class="container py-4" style="max-width:520px">
    <h2 class="mb-3">Firebase Register</h2>

    <form @submit.prevent="register" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model.trim="email" type="email" class="form-control" required placeholder="you@example.com" />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" required minlength="6" placeholder="••••••" />
      </div>

      <button class="btn btn-success w-100" :disabled="pending || !isValid">
        {{ pending ? 'Creating…' : 'Create account' }}
      </button>

      <p class="small mt-3 mb-0">Already have an account?
        <router-link :to="{name:'FireLogin'}">Login</router-link>
      </p>
    </form>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getApp } from 'firebase/app'

const email = ref('')
const password = ref('')
const pending = ref(false)
const router = useRouter()

const isValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) && (password.value?.length >= 6)
)

const withTimeout = (p, ms = 15000) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

const register = async () => {
  if (!isValid.value || pending.value) return
  pending.value = true
  try {
    const auth = getAuth()
    const cred = await withTimeout(createUserWithEmailAndPassword(auth, email.value, password.value))

    try {
      const db = getFirestore(getApp())
      await withTimeout(setDoc(doc(db, 'users', cred.user.uid), {
        email: email.value,
        role: 'member',
        createdAt: serverTimestamp()
      }))
    } catch (err) {
      console.warn('Save user role failed (will continue anyway):', err?.code || err?.message || err)
    }

    router.push({ name: 'FireLogin' })
  } catch (err) {
    alert('Register failed: ' + (err?.code || err?.message || String(err)))
  } finally {
    pending.value = false
  }
}
</script>