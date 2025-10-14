<template>
  <section class="p-3 space-y-3">
    <h1 class="h5">Explore & Route</h1>

    <form @submit.prevent="searchPoi" class="d-flex gap-2">
      <input v-model="poiQuery" class="form-control" placeholder="Search places (e.g. Monash University)" required />
      <button class="btn btn-primary" type="submit">Search</button>
      <button class="btn btn-outline-secondary" type="button" @click="locateMe">Locate me</button>
    </form>

    <ul v-if="results.length" class="list-group mt-2">
      <li
        v-for="(r,i) in results"
        :key="r.id"
        class="list-group-item list-group-item-action"
        @click="pickResult(i)"
      >
        <strong>{{ r.text }}</strong>
        <small class="text-secondary d-block">{{ r.place_name }}</small>
      </li>
    </ul>

    <form @submit.prevent="buildRoute" class="mt-3">
      <div class="row g-2">
        <div class="col-sm-6">
          <input v-model="fromQuery" class="form-control" placeholder="From" required />
        </div>
        <div class="col-sm-6">
          <input v-model="toQuery" class="form-control" placeholder="To" required />
        </div>
      </div>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-primary" type="submit">Get route</button>
        <button class="btn btn-outline-secondary" type="button" @click="clearRoute">Clear</button>
      </div>
      <p v-if="routeInfo" class="mt-2">
        Distance: {{ routeInfo.distanceKm.toFixed(2) }} km · Duration: {{ routeInfo.durationMin.toFixed(0) }} min
      </p>
    </form>

    <div id="map" ref="mapEl" class="mapbox-container"></div>
  </section>
</template>

<script setup>
import mapboxgl from 'mapbox-gl'
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'
import { ref, onMounted, onBeforeUnmount } from 'vue'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const geocoding = mbxGeocoding({ accessToken: mapboxgl.accessToken })

const mapEl = ref(null)
let map
let poiMarkers = []
let routeLayerId = 'route-line'
let routeSourceId = 'route-source'

const poiQuery = ref('')
const results = ref([])

const fromQuery = ref('')
const toQuery = ref('')
const routeInfo = ref(null)

onMounted(() => {
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
})

onBeforeUnmount(() => {
  if (map) map.remove()
})

async function searchPoi () {
  const resp = await geocoding.forwardGeocode({
    query: poiQuery.value,
    limit: 5,
    countries: ['au']
  }).send()

  results.value = resp.body.features || []
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
  if (!fromC || !toC) return alert('Could not find one of the locations.')

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromC.join(',')};${toC.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
  const res = await fetch(url)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) return alert('No route found.')

  const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: route.geometry }] }

  if (map.getSource(routeSourceId)) {
    map.getSource(routeSourceId).setData(geojson)
  } else {
    map.addSource(routeSourceId, { type: 'geojson', data: geojson })
    map.addLayer({ id: routeLayerId, type: 'line', source: routeSourceId, paint: { 'line-width': 4, 'line-color': '#1d4ed8' } })
  }

  const coords = route.geometry.coordinates
  const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]))
  map.fitBounds(bounds, { padding: 40 })

  routeInfo.value = { distanceKm: route.distance / 1000, durationMin: route.duration / 60 }
}

async function geocodeOne (q) {
  if (!q.trim()) return []
  const resp = await geocoding.forwardGeocode({ query: q, limit: 1, countries: ['au'] }).send()
  const f = resp.body.features?.[0]
  return f ? [f.center] : []
}

function clearRoute () {
  if (map?.getLayer(routeLayerId)) map.removeLayer(routeLayerId)
  if (map?.getSource(routeSourceId)) map.removeSource(routeSourceId)
  routeInfo.value = null
}

function locateMe () {
  if (!navigator.geolocation) return alert('Geolocation not supported.')
  navigator.geolocation.getCurrentPosition(pos => {
    const { longitude: lng, latitude: lat } = pos.coords
    map.flyTo({ center: [lng, lat], zoom: 14 })
    const m = new mapboxgl.Marker({ color: 'green' }).setLngLat([lng, lat]).addTo(map)
    poiMarkers.push(m)
  })
}
</script>

<style scoped>
.mapbox-container { height: 500px; border-radius: 12px; }
</style>
