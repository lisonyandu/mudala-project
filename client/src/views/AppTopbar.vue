<template>
  <div class="layout-topbar">
    <button
      class="p-link layout-menu-button layout-topbar-button"
      @click="onMenuToggle"
    >
      <i class="pi pi-th-large"></i>
    </button>

    <router-link to="/" class="layout-topbar-logo">
<!--            <span>Carbon Credit Market</span>-->
<!--      <span class="text-primary"> Market</span>-->
      <img alt="Logo" :src="logo()" />
    </router-link>

    <ul class="layout-topbar-menu hidden lg:flex origin-top">
      <li>
<!--        <Button
            label="Connect Wallet"
            icon="pi pi-wallet"
            class="mr-2 mb-2"
        ></Button>-->
<!--        <button class="p-link layout-topbar-button">
          <i class="pi pi-wallet"></i>
          <span>Wallet</span>
        </button>-->
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  methods: {
    onMenuToggle(event) {
      this.$emit("menu-toggle", event);
    },
    logo() {
      return this.$appState.darkTheme
        ? "images/logo1.png"
        : "images/logo1.png";
    },
  },
  computed: {
    darkTheme() {
      return this.$appState.darkTheme;
    },
  },
};
</script>
