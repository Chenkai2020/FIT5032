<template>
  <section class="container py-4" style="max-width:520px">
    <h2 class="mb-3">Firebase Register</h2>

    <form @submit.prevent="register" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input
          v-model.trim="email"
          type="email"
          class="form-control"
          required
          maxlength="254"
          placeholder="you@example.com"
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input
          v-model="password"
          type="password"
          class="form-control"
          required
          minlength="6"
          maxlength="128"
          placeholder="••••••"
        />
        <div class="form-text">At least 6 characters.</div>
      </div>

      <button class="btn btn-success w-100" :disabled="pending || !isValid">
        {{ pending ? 'Creating…' : 'Create account' }}
      </button>

      <p class="small mt-3 mb-0">
        Already have an account?
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
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value || '') &&
  (password.value && password.value.length >= 6)
)

function hasScript (s) {
  if (!s) return false
  const str = String(s)
  return /<\s*script/i.test(str) || /javascript\s*:/i.test(str) || /\son\w+\s*=/i.test(str)
}
function sanitize (s) {
  const map = { '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','/':'&#x2F;' }
  return String(s ?? '').replace(/[<>&"'/]/g, ch => map[ch])
}

const register = async () => {
  if (!isValid.value || pending.value) return

  if (hasScript(email.value)) {
    alert('Detected script-like input. Please remove it.')
    return
  }

  pending.value = true
  try {
    const auth = getAuth()
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)

    const db = getFirestore(getApp())
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: sanitize(email.value.trim()),
      role: 'member',
      createdAt: serverTimestamp()
    })

    router.push({ name: 'FireLogin' })
  } catch (err) {
    alert('Register failed: ' + (err?.code || err?.message || String(err)))
  } finally {
    pending.value = false
  }
}
</script>
