<template>
  <div class="app-wrap">
    <nav class="navbar navbar-expand-lg bg-light border-bottom">
      <div class="container">
        <a class="navbar-brand" href="#">
          Community Football
        </a>

        <div id="nav" class="navbar-collapse">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a href="#" class="nav-link" :class="{active: tab==='home'}" @click.prevent="tab='home'">Home</a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link" :class="{active: tab==='events'}" @click.prevent="tab='events'">Events</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <section v-if="tab==='home'" class="py-5" style="background:#f8fbff">
      <div class="container">
        <h1 class="h2 mb-3">Health promotion through <span class="text-primary">community football</span></h1>
        <p class="text-secondary">Find local sessions and make healthy habits through football.</p>
        <button class="btn btn-primary" @click="tab='events'">
          Find sessions
        </button>
      </div>
    </section>

    <section v-if="tab==='events'" class="py-4">
      <div class="container">
        <EventsRegistration />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EventsRegistration from './EventsRegistration.vue'

let tab = ref('home')
</script>

<style scoped>
.app-wrap { min-height: 100vh; background:#fff; }
</style>