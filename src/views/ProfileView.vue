<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'

const bookings = ref([])
const ratings  = ref([])

async function loadData () {
  bookings.value = Array.from({length: 28}).map((_, i) => ({
    bookingId: 'B' + (i+1),
    eventTitle: i % 2 ? 'League' : 'Friendly',
    eventFrom: '2025-11-01',
    eventTo:   '2025-11-30',
    eventWhere:'Clayton Pitch',
    name: 'User ' + (i+1),
    email: `user${i+1}@example.com`,
    level: ['Beginner','Intermediate','Advanced'][i % 3],
    createdAt: '2025-10-01 12:00'
  }))

  ratings.value = [
    { eventId: 1, value: 5, updatedAt: '2025-10-01 12:00' },
    { eventId: 2, value: 3, updatedAt: '2025-10-02 09:18' },
    { eventId: 3, value: 4, updatedAt: '2025-10-02 10:05' },
    { eventId: 4, value: 3, updatedAt: '2025-10-03 10:20' }
  ]
}

const tblBookings = ref(null)
const tblRatings  = ref(null)
let dtBookings = null
let dtRatings  = null

function wirePerColumnSearch (api, tableEl) {
  const filterRow = tableEl.querySelector('thead tr.filters')
  if (!filterRow) return
  const inputs = filterRow.querySelectorAll('th input, th select')

  api.columns().every(function (colIdx) {
    const input = inputs[colIdx]
    if (!input) return
    const that = this
    const handler = () => {
      const val = input.value
      if (that.search() !== val) {
        that.search(val).draw()
      }
    }
    input.addEventListener('input', handler)
  })
}

function ts () {
  return new Date().toISOString().slice(0,19).replace(/[-:T]/g,'')
}

onMounted(async () => {
  await loadData()
  await nextTick()

  dtBookings = window.$(tblBookings.value).DataTable({
    paging: true,
    searching: true,
    ordering: true,
    pageLength: 10,
    lengthChange: false,
    orderCellsTop: true,
    retrieve: true,
    dom: "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6 text-end'B>>" +
         "t" +
         "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    buttons: [
      {
        extend: 'csvHtml5',
        text: 'CSV (filtered)',
        bom: true,
        filename: () => `bookings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } }
      },
      {
        extend: 'pdfHtml5',
        text: 'PDF (filtered)',
        orientation: 'landscape',
        pageSize: 'A4',
        title: 'My Bookings',
        filename: () => `bookings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } },
        customize: function (doc) {
          doc.styles.tableHeader.alignment = 'left'
        }
      },
      {
        extend: 'excelHtml5',
        text: 'Excel (filtered)',
        title: null,
        filename: () => `bookings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } }
      },
      { extend: 'print', text: 'Print' }
    ],
    initComplete: function () {
      const api = this.api()
      wirePerColumnSearch(api, tblBookings.value)
    }
  })

  dtRatings = window.$(tblRatings.value).DataTable({
    paging: true,
    searching: true,
    ordering: true,
    pageLength: 10,
    lengthChange: false,
    orderCellsTop: true,
    retrieve: true,
    dom: "<'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6 text-end'B>>" +
         "t" +
         "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    buttons: [
      {
        extend: 'csvHtml5',
        text: 'CSV (filtered)',
        bom: true,
        filename: () => `ratings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } }
      },
      {
        extend: 'pdfHtml5',
        text: 'PDF (filtered)',
        orientation: 'landscape',
        pageSize: 'A4',
        title: 'My Ratings',
        filename: () => `ratings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } }
      },
      {
        extend: 'excelHtml5',
        text: 'Excel (filtered)',
        title: null,
        filename: () => `ratings_${ts()}`,
        exportOptions: { columns: ':visible', modifier: { search: 'applied', order: 'applied' } }
      },
      { extend: 'print', text: 'Print' }
    ],
    initComplete: function () {
      const api = this.api()
      wirePerColumnSearch(api, tblRatings.value)
    }
  })
})

onBeforeUnmount(() => {
  if (dtBookings) { dtBookings.destroy(); dtBookings = null }
  if (dtRatings)  { dtRatings.destroy();  dtRatings  = null }
})
</script>

<template>
  <section class="container py-4" style="max-width:1100px">
    <h2 class="mb-4">My Profile</h2>
    <div class="card mb-5">
      <div class="card-body">
        <h5 class="mb-3">My Bookings</h5>
        <div class="table-responsive">
          <table
            id="tblBookings"
            ref="tblBookings"
            class="display stripe hover"
            style="width:100%"
            aria-label="My bookings"
          >
            <thead>
              <tr>
                <th>BookingID</th>
                <th>Event</th>
                <th>From</th>
                <th>To</th>
                <th>Location</th>
                <th>Name</th>
                <th>Email</th>
                <th>Level</th>
                <th>CreatedAt</th>
              </tr>
              <tr class="filters">
                <th><input placeholder="ID" /></th>
                <th><input placeholder="Event" /></th>
                <th><input placeholder="From" /></th>
                <th><input placeholder="To" /></th>
                <th><input placeholder="Location" /></th>
                <th><input placeholder="Name" /></th>
                <th><input placeholder="Email" /></th>
                <th><input placeholder="Level" /></th>
                <th><input placeholder="YYYY-MM" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in bookings" :key="b.bookingId">
                <td>{{ b.bookingId }}</td>
                <td>{{ b.eventTitle }}</td>
                <td>{{ b.eventFrom }}</td>
                <td>{{ b.eventTo }}</td>
                <td>{{ b.eventWhere }}</td>
                <td>{{ b.name }}</td>
                <td>{{ b.email }}</td>
                <td>{{ b.level }}</td>
                <td>{{ b.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h5 class="mb-3">My Ratings</h5>
        <div class="table-responsive">
          <table
            id="tblRatings"
            ref="tblRatings"
            class="display stripe hover"
            style="width:100%"
            aria-label="My ratings"
          >
            <thead>
              <tr>
                <th>EventID</th>
                <th>My Rating</th>
                <th>UpdatedAt</th>
              </tr>
              <tr class="filters">
                <th><input placeholder="EventID" /></th>
                <th><input placeholder="1-5" /></th>
                <th><input placeholder="YYYY-MM" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in ratings" :key="r.eventId">
                <td>{{ r.eventId }}</td>
                <td>{{ r.value }}</td>
                <td>{{ r.updatedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
thead tr.filters th {
  padding: 6px 8px;
  vertical-align: middle;
}
thead tr.filters input,
thead tr.filters select {
  width: 100%;
  box-sizing: border-box;
  font-size: 0.9rem;
  padding: 4px 6px;
}
</style>