<template>
  <div class="grid">
    <div class="col-12">
      <div class="">
        <h5>{{ title }}</h5>
        <p></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
  },
};
</script>


<!--
<div class="col-12">
<div class="card">
  &lt;!&ndash;        <h5>{{ title }}</h5>&ndash;&gt;
  &lt;!&ndash;        <p></p>&ndash;&gt;

  <div>

    <div class="grid p-fluid">
      <div class="col-12 md:col-4">
        <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
          <InputText placeholder="Username" />
        </div>
      </div>

      <div class="col-12 md:col-4">
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon">$</span>
          <InputText placeholder="Price" />
        </div>
      </div>

      <div class="col-12 md:col-4">
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon">W</span>
          <InputText placeholder="Website" />
        </div>
      </div>
    </div>
    <Button
        label="Become A Seller"
        icon="pi pi-wallet"
        class="mr-2 mb-2"
    ></Button>
  </div>
</div>
</div>-->
