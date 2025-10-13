<template>
  <section class="p-3 space-y-3">
    <h1 id="map-title" class="h5">Explore & Route</h1>
    <form class="search-form" @submit.prevent="searchPoi" aria-labelledby="poi-label">
      <label id="poi-label" for="poiInput" class="form-label">Search places of interest</label>
      <div class="d-flex gap-2">
        <input
          id="poiInput"
          v-model="poiQuery"
          type="search"
          class="form-control"
          placeholder="e.g., cafe, museum, Monash Clayton"
          aria-describedby="poi-help"
          required
        />
        <button class="btn btn-primary" type="submit">Search</button>
        <button class="btn btn-outline-secondary" type="button" @click="locateMe">Locate me</button>
      </div>
      <small id="poi-help" class="text-secondary">
        Enter a place or keyword, press Search. Results listed below; use ↑/↓ navigate, Enter to select.
      </small>

      <ul
        v-if="results.length"
        role="listbox"
        :aria-label="`Search results for ${poiQuery}`"
        class="list-group mt-2"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="chooseActive"
        tabindex="0"
      >
        <li
          v-for="(r,i) in results"
          :key="r.id"
          role="option"
          :aria-selected="i===activeIndex"
          class="list-group-item list-group-item-action"
          :class="{active:i===activeIndex}"
          @click="pickResult(i)"
          @mouseenter="activeIndex=i"
        >
          <strong>{{ r.text }}</strong>
          <small class="text-secondary d-block">{{ r.place_name }}</small>
        </li>
      </ul>
    </form>

    <form class="route-form" @submit.prevent="buildRoute" aria-labelledby="route-label">
      <h2 id="route-label" class="h6 mt-3">Plan a route</h2>
      <div class="row g-2">
        <div class="col-sm-6">
          <label for="fromInput" class="form-label">From</label>
          <input id="fromInput" v-model="fromQuery" class="form-control" placeholder="Origin address or place" required>
        </div>
        <div class="col-sm-6">
          <label for="toInput" class="form-label">To</label>
          <input id="toInput" v-model="toQuery" class="form-control" placeholder="Destination address or place" required>
        </div>
      </div>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-primary" type="submit">Get route</button>
        <button class="btn btn-outline-secondary" type="button" @click="clearRoute">Clear</button>
      </div>
      <p class="mt-2" aria-live="polite">
        <span v-if="routeInfo">Distance: {{ routeInfo.distanceKm.toFixed(2) }} km · Duration: {{ routeInfo.durationMin.toFixed(0) }} min</span>
      </p>
    </form>

    <div
      id="map"
      ref="mapEl"
      class="mapbox-container"
      role="region"
      aria-labelledby="map-title"
      aria-describedby="map-desc"
      tabindex="0"
    ></div>
    <p id="map-desc" class="visually-hidden">
      Interactive map. Use keyboard to focus search results, or mouse/touch to pan and zoom the map.
    </p>
  </section>
</template>

<script setup>
import mapboxgl from 'mapbox-gl'
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const geocoding = mbxGeocoding({ accessToken: mapboxgl.accessToken })

const mapEl = ref(null)
let map
let poiMarkers = []
let routeLayerId = 'route-line'
let routeSourceId = 'route-source'

const poiQuery = ref('')
const results = ref([])
const activeIndex = ref(0)

const fromQuery = ref('')
const toQuery = ref('')
const routeInfo = ref(null)

onMounted(async () => {
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11,
    attributionControl: true,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  await new Promise((resolve) => map.on('load', resolve))

  const qTo = route.query.to ? String(route.query.to) : ''
  if (qTo) {
    toQuery.value = qTo
    poiQuery.value = qTo
    await searchPoi()  
    pickResult(0)       
  }
})


onBeforeUnmount(() => {
  if (map) map.remove()
})

async function searchPoi () {
  if (!poiQuery.value.trim()) return
  const resp = await geocoding.forwardGeocode({
    query: poiQuery.value,
    autocomplete: true,
    limit: 8
  }).send()

  results.value = resp.body.features || []
  activeIndex.value = 0
}

function moveActive(step) {
  if (!results.value.length) return
  activeIndex.value = (activeIndex.value + step + results.value.length) % results.value.length
}

function chooseActive() {
  if (!results.value.length) return
  pickResult(activeIndex.value)
}

function pickResult(i) {
  const f = results.value[i]
  if (!f) return
  poiMarkers.forEach(m => m.remove())
  poiMarkers = []

  const [lng, lat] = f.center
  const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map)
  poiMarkers.push(marker)

  map.flyTo({ center: [lng, lat], zoom: 14 })
}

async function buildRoute () {
  const [fromC] = await geocodeOne(fromQuery.value)
  const [toC]   = await geocodeOne(toQuery.value)
  if (!fromC || !toC) return alert('Could not geocode one of the locations.')
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromC.join(',')};${toC.join(',')}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
  const res = await fetch(url)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) return alert('No route found.')

  const geojson = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: route.geometry }]
  }

  if (map.getSource(routeSourceId)) {
    map.getSource(routeSourceId).setData(geojson)
  } else {
    map.addSource(routeSourceId, { type: 'geojson', data: geojson })
    map.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeSourceId,
      paint: { 'line-width': 4, 'line-color': '#1d4ed8' }
    })
  }

  const coords = route.geometry.coordinates
  const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]))
  map.fitBounds(bounds, { padding: 40 })

  routeInfo.value = {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60
  }
}

async function geocodeOne (q) {
  const resp = await geocoding.forwardGeocode({ query: q, limit: 1 }).send()
  const f = resp.body.features?.[0]
  return f ? [f.center] : []
}

function locateMe () {
  if (!navigator.geolocation) return alert('Geolocation not supported.')
  navigator.geolocation.getCurrentPosition(pos => {
    const { longitude: lng, latitude: lat } = pos.coords
    map.flyTo({ center: [lng, lat], zoom: 14 })
    const m = new mapboxgl.Marker({ color: '#16a34a' }).setLngLat([lng, lat]).addTo(map)
    poiMarkers.push(m)
  }, () => alert('Failed to get location.'))
}
</script>

<style scoped>
.mapbox-container { height: 520px; border-radius: 12px; }
.visually-hidden { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.list-group-item.active { outline: 2px solid #000; }
</style>
