<template>
  <div class="layout-footer">
<!--    <img alt="Logo" :src="footerImage()" height="20" class="mr-2" />-->
    <p> © Mudala, 2022</p>
  </div>
</template>

<script>
export default {
  name: "AppFooter",
  methods: {
    /*footerImage() {
      return this.$appState.darkTheme
        ? "images/logo-white.png"
        : "images/logo.png";
    },*/
  },
  computed: {
    darkTheme() {
      return this.$appState.darkTheme;
    },
  },
};
</script>
