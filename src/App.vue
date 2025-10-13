<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
</script>

<template>
  <div class="app-wrap">
    <nav class="navbar navbar-expand-lg bg-light border-bottom">
      <div class="container">
        <a class="navbar-brand" href="#">Community Football</a>

        <div id="nav" class="navbar-collapse">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
                <router-link to="/Firelogin" class="nav-link" active-class="active">Firebase Login</router-link>
            </li>
            <li class="nav-item">
                <router-link to="/FireRegister" class="nav-link" active-class="active">Firebase Register</router-link>
            </li>
            <li class="nav-item">
                <router-link to="/profile" class="nav-link" active-class="active">My Profile</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>