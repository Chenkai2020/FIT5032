<template>
  <div class="d-flex align-items-center gap-2">
    <button
      v-for="n in 5" :key="n"
      class="star-btn"
      :class="{ active: n <= myScore }"
      :disabled="!isLoggedIn"
      @click="rate(n)"
      :aria-label="`Rate ${n}`"
    >★</button>

    <small class="text-secondary">
      <span v-if="!isLoggedIn">Login to rate</span>
      <span v-else>My rating: {{ myScore || '—' }}/5</span>
    </small>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getApp } from 'firebase/app'

const props = defineProps({
  eventId: { type: [String, Number], required: true }
})

const auth = getAuth()
const db = getFirestore(getApp())

const userId = ref(auth.currentUser?.uid || null)
const isLoggedIn = computed(() => !!userId.value)
const myScore = ref(0)

let stopDoc = null
let stopAuth = null

function subscribeMyRating () {
  if (!userId.value) return
  const rDoc = doc(db, 'events', String(props.eventId), 'ratings', userId.value)
  stopDoc = onSnapshot(rDoc, (snap) => {
    myScore.value = snap.exists() ? Number(snap.data().value || 0) : 0
  })
}

function resubscribe () {
  if (stopDoc) { stopDoc(); stopDoc = null }
  subscribeMyRating()
}

async function rate (n) {
  if (!userId.value) return
  const v = Math.min(5, Math.max(1, Math.round(n)))
  const rDoc = doc(db, 'events', String(props.eventId), 'ratings', userId.value)
  await setDoc(rDoc, { value: v })
}

onMounted(() => {
  resubscribe()
  stopAuth = onAuthStateChanged(auth, (u) => {
    userId.value = u?.uid || null
    myScore.value = 0
    resubscribe()
  })
})

watch(() => props.eventId, () => resubscribe())

onUnmounted(() => {
  if (stopDoc) stopDoc()
  if (stopAuth) stopAuth()
})
</script>

<style scoped>
.star-btn{
  border:none; background:transparent; font-size:20px; line-height:1;
  cursor:pointer; opacity:.35; padding:0 .06rem;
}
.star-btn.active{ opacity:1 }
.star-btn:disabled{ cursor:not-allowed; opacity:.25 }
</style>