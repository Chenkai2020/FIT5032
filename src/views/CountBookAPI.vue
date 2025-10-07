<template>
  <pre>{{ jsondata }}</pre>
</template>
<script>
import axios from 'axios';

export default {
  data() {
    return {
      jsondata: null,
      error: null
    };
  },
  mounted() {
    this.getBookCountAPI();
  },

  methods: {
  async getBookCountAPI() {
    try {
      const response = await axios.get('https://us-central1-fit5032-week6-79296.cloudfunctions.net/countBooks');
      this.jsondata = response.data;
      this.error = null;
    } catch (error) {
      console.error('Error fetching book count:', error);
      this.error = error;
      this.count = null;
    }
  },
},
};
</script>
