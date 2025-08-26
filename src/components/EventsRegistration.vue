<template>
  <div>
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
      <h2 class="h4 mb-0">Event Details & Registration</h2>
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 small text-secondary">Event Type</label>
        <select v-model="filterType" class="form-select" style="min-width:200px">
          <option value="">All</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card mb-3">
          <div class="card-body text-center">
            <p class="mb-2">You can enrol after creating a member account.</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <p class="mb-0 small">Some sessions are more demanding. If you’re new to sport or have health concerns, ask organisers which activity fits you.</p>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="vstack gap-3">
          <div v-for="e in shown()" :key="e.id" class="card">
            <div class="card-body d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
              <div class="me-sm-3">
                <div class="fw-semibold">{{ e.title }}</div>
                <div class="small">Event Type: {{ e.type }}</div>
                <div class="small">Date: from {{ e.from }} to {{ e.to }}</div>
                <div class="small">Location: {{ e.where }}</div>
              </div>
              <button class="btn btn-outline-primary mt-2 mt-sm-0" @click="startRegister(e)">Register</button>
            </div>
          </div>

          <div v-if="shown().length===0" class="text-center text-secondary py-5">No events.</div>
        </div>

        <div v-if="selected" class="card mt-4">
          <div class="card-body">
            <h5 class="card-title mb-3">Register — {{ selected.title }}</h5>

            <form @submit.prevent="submitForm" novalidate>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full name</label>
                  <input v-model.trim="form.name" class="form-control" required>
                  <div v-if="tried && !checkNotEmpty(form.name)" class="text-danger small mt-1">Name is required.</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input v-model.trim="form.email" type="email" class="form-control" required>
                  <div v-if="tried && !checkEmail(form.email)" class="text-danger small mt-1">Please enter a valid email.</div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Level</label>
                  <select v-model="form.level" class="form-select" required>
                    <option value="">Select…</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <div v-if="tried && !checkNotEmpty(form.level)" class="text-danger small mt-1">Choose a level.</div>
                </div>

                <div class="col-12">
                  <div class="form-check">
                    <input v-model="form.ok" type="checkbox" class="form-check-input" id="agree">
                    <label class="form-check-label" for="agree">I agree to community guidelines.</label>
                  </div>
                  <div v-if="tried && !form.ok" class="text-danger small mt-1">Please agree.</div>
                </div>
              </div>

              <div class="mt-3 d-flex gap-2">
                <button class="btn btn-primary" type="submit">Submit</button>
                <button class="btn btn-outline-secondary" type="button" @click="cancel()">Cancel</button>
              </div>

            </form>
          </div>
        </div>

        <div class="text-center text-secondary small mt-4">
          Contact: 0489310865 / <a href="mailto:alexander202108@163.com">alexander202108@163.com</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
let list = ref([
  { id: 1, title: 'Clayton League',              type: 'League',         from: '18 Aug 2025', to: '18 Oct 2025', where: 'Clayton Pitch' },
  { id: 2, title: 'United Through Football',     type: 'Friendly Match', from: '20 Aug 2025', to: '20 Sep 2025', where: 'Boxhill Pitch' },
  { id: 3, title: 'Friendly to beginner Match',  type: 'Beginner Match', from: '18 Aug 2025', to: '18 Oct 2025', where: 'City Pitch' },
  { id: 4, title: 'Beginner skill course',       type: 'Course',         from: '20 Oct 2025', to: '25 Oct 2025', where: 'City Pitch' }
])
let types = ['League','Friendly Match','Beginner Match','Course']
let filterType = ref('')

function shown () {
  if (!filterType.value) return list.value
  return list.value.filter(x => x.type === filterType.value)
}

let selected = ref(null)
let form = reactive({ name:'', email:'', level:'', ok:false })
let tried = ref(false)

function checkNotEmpty (v) {
  return v && v.trim().length > 0
}
function checkEmail (v) {
  return v && v.includes('@') && v.includes('.')
}

function startRegister (e) {
  selected.value = e
  form.name = ''
  form.email = ''
  form.level = ''
  form.ok = false
  tried.value = false
}

const LS_KEY = 'eventRegs'
let regs = ref([])

function submitForm () {
  tried.value = true
  if (!checkNotEmpty(form.name)) return
  if (!checkEmail(form.email)) return
  if (!checkNotEmpty(form.level)) return
  if (!form.ok) return

  regs.value.push({
    id: Date.now().toString(),
    eventId: selected.value.id,
    name: form.name,
    email: form.email,
    level: form.level,
    when: new Date().toLocaleString()
  })
  localStorage.setItem(LS_KEY, JSON.stringify(regs.value))

  alert('Saved')
  selected.value = null
}

function cancel () {
  selected.value = null
}

onMounted(() => {
  const saved = localStorage.getItem(LS_KEY)
  if (saved) {
    const arr = JSON.parse(saved)
    if (Array.isArray(arr)) {
      regs.value = arr
    }
  }
})
</script>

<style scoped>
.card { border: 1px solid #e7e7e7; }
</style>