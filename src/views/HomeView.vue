<template>
  <section class="container py-5">
    <h2 class="mb-3">Community Football</h2>
    <router-link :to="{ name: 'events' }" class="btn btn-primary mb-4">Find Events</router-link>

    <div class="card">
      <div class="card-body">
        <h6 class="card-title">Auth Debug</h6>
        <p class="mb-1">Email: <strong>{{ email || '—' }}</strong></p>
        <p class="mb-0">Role: <strong>{{ role }}</strong></p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getApp } from 'firebase/app'

const email = ref('')
const role = ref('guest')

const auth = getAuth()
onAuthStateChanged(auth, async (user) => {
  if (!user) { email.value=''; role.value='guest'; return }
  email.value = user.email || ''
  try {
    const db = getFirestore(getApp())
    const snap = await getDoc(doc(db, 'users', user.uid))
    role.value = snap.exists() ? (snap.data().role || 'member') : 'member'
  } catch { role.value = 'member' }
})
</script>