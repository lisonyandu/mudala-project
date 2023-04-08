<template>
  <Toast position="top-right" />
  <div class="grid">
    <div class="col-12">

        <div class="grid grid-nogutter text-800">
          <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center">
            <section>
              <div>
                <span class="text-5xl font-bold mb-1">Play a Part in reducing Carbon Emissions</span>
              </div>

              <p class="mt-5">
                The Leading Trading Platform for Carbon Credits in South Africa
              </p>

              <div>
                <Dialog header="Member Registration" v-model:visible="display" :breakpoints="{'960px': '75vw'}"
                        :style="{width: '30vw'}" :modal="true">

                  <div class=" p-fluid">
                    <div class="col-12">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
                        <InputText placeholder="Organisation Name"
                         v-model="companyname"/>
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                      <i class="pi pi-wallet"></i>
                    </span>
                        <InputText placeholder="Wallet Address"
                        v-model="walletaddress"/>
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                      <i class="pi pi-user"></i>
                    </span>
                        <Dropdown v-model="membertype" :options="dropdownValues" optionLabel="name" placeholder="Member Type" />
                      </div>
                    </div>

                    <div class="col-12" v-if="membertype !== null && membertype.code ==='seller' ">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                      <i class="pi pi-pencil"></i>
                    </span>
                        <InputText placeholder="Project ID"
                                   v-model="projectid"
                                   />
                      </div>
                    </div>

                    <div class="col-12" v-if="membertype !== null && membertype.code ==='buyer' ">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                      <i class="pi pi-pencil"></i>
                    </span>
                        <InputText placeholder="Tax ID"
                                   v-model="taxid"
                        />
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                      <i class="pi pi-inbox"></i>
                    </span>
                        <InputText placeholder="Email" type="email"
                                   v-model="email"
                                   />
                      </div>
                    </div>

                  </div>


                  <template #footer>
                    <Button label="Register" @click="register" icon="pi pi-check" class="p-button-outlined"/>
                  </template>
                </Dialog>
                <Button class="mt-5" label="Become A Member" icon="pi pi-external-link" style="width: auto" @click="open"/>

                <transition-group name="p-message" tag="div">
                  <Message v-for="msg of message" :severity="msg.severity" :key="msg.content">{{msg.content}}</Message>
                </transition-group>
              </div>

            </section>
          </div>
          <div class="col-12 md:col-6 overflow-hidden flex align-items-center justify-content-center">
            <img
                :src="heroImage()"
                alt="Image"
                class="md:h-25rem md:w-fit"
                style="width: 100%"
            />
          </div>
        </div>

    </div>


  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      display: false,
      companyname: null,
      walletaddress: null,
      projectid: null,
      taxid: null,
      email: null,
      memberid: null,
      dataLoaded: false,
      message: [],
      dropdownValues: [
        {name: 'Seller', code: 'seller'},
        {name: 'Buyer', code: 'buyer'}
      ],
      membertype: null,
    }
  },
  methods: {
    heroImage() {
      return this.$appState.darkTheme
          ? "images/img_1.png"
          : "images/img_1.png";
    },
    logo() {
      return this.$appState.darkTheme
          ? "images/logo1.png"
          : "images/logo1.png";
    },
    /*clickMethod(path) {
      this.$router.push(path);
    },*/
    open() {
      this.display = true;
    },
    close() {
      this.display = false;
    },
    successToast(s, d) {
      this.$toast.add({
        severity: "success",
        summary: s,
        detail: d,
        life: 4000,
      });
    },
    errorToast(s, d) {
      this.$toast.add({
        severity: "error",
        summary: s,
        detail: d,
        life: 3000,
      });
    },
    register(){
      axios.post('/member/register', {
        companyname: this.companyname,
        walletaddress: this.walletaddress.toLowerCase(),
        membertype: this.membertype.code,
        projectid: this.projectid,
        taxid: this.taxid,
        email: this.email
          }
      ).then(res => {
        this.memberid = res.data.memberid;
        this.dataLoaded = true;
        this.successToast("Member Code",`Your Membership ID is ${res.data.memberid}`)
        this.message = [{severity: 'success', detail: 'Success ', content: `Your Membership ID is ${res.data.memberid}`}]
        this.close();
      }).catch(err => {
        console.log(err.message);
        this.errorToast("Error", "Registration error")
      })
    }
  },
};
</script>
