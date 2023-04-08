<template>
  <Toast position="top-right"/>
  <div class="grid">

    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Total Minted</span>
            <div class="text-900 font-medium text-xl">{{ totalsupply }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-blue-100 border-round"
               style="width:2.5rem;height:2.5rem">
            <i class="pi pi-shopping-cart text-blue-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">CCT </span>
        <span class="text-500">Tokens</span>
      </div>
    </div>
    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Validator Balance</span>
            <div class="text-900 font-medium text-xl">{{ validatorbalance }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round"
               style="width:2.5rem;height:2.5rem">
            <i class="pi pi-wallet text-orange-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">CCT </span>
        <span class="text-500">Tokens</span>
      </div>
    </div>

    <div class="col-12 lg:col-6 xl:col-3"></div>
    <div class="col-12 lg:col-6 xl:col-3 flex justify-content-end">
      <div>
        <Dialog header="Mint" v-model:visible="displayMint" :breakpoints="{'960px': '75vw'}"
                :style="{width: '30vw'}" :modal="true">

          <div class=" p-fluid">
            <div class="col-12">
              <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
                <InputText placeholder="Mint Amount" type="number"
                           v-model="mintamount"/>
              </div>
            </div>
          </div>

          <template #footer>
            <Button label="Mint" @click="mintTokens" icon="pi pi-check" class="p-button-outlined"/>
          </template>
        </Dialog>
        <Button label="Mint Tokens" icon="pi pi-wallet" @click="open('mint')"/>
      </div>
    </div>

    <div class="col-12">
      <div class="">
        <div class="mt-5">
          <DataTable :value="requests">
            <template #header> Credit Requests</template>
            <Column
                v-for="col of requestsColumns"
                :field="col.field"
                :header="col.header"
                :key="col.field"
            >

              <template #body="slotProps" v-if="col.field === 'status'">
                <span :class="'customer-badge status-'+ slotProps.data.status">{{ slotProps.data.status }}</span>
              </template>

            </Column>
            <Column headerStyle="width:10rem">
              <template #body="slotProps">
                <div class="grid" style="min-width: 10rem;">
                  <Dialog header="Transfer" v-model:visible="displayTranfer" :breakpoints="{'960px': '75vw'}"
                          :style="{width: '30vw'}" :modal="true">

                    <div class=" p-fluid">
                      <div class="col-12">
                        <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
                          <InputText placeholder="Transfer Amount" type="number"
                                     v-model="transferamount"/>
                        </div>
                      </div>
                    </div>

                    <template #footer>
                      <Button label="Transfer" @click="transferTokens(slotProps.data)" icon="pi pi-check"
                              class="p-button-outlined"/>
                    </template>
                  </Dialog>
                  <Button icon="pi pi-check-square p-button-icon-only" @click="open('transfer')"
                          v-if="slotProps.data.status === 'pending'"/>

                  <Button class="p-button-danger p-button-icon-only ml-1" icon="pi pi-times"
                          @click="declineRequest(slotProps.data)"
                          v-if="slotProps.data.status === 'pending'"/>
                </div>
              </template>
            </Column>

          </DataTable>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import axios from "axios";

export default {
  props: {
    title: String,
  },
  data() {
    return {
      displayMint: false,
      displayTranfer: false,
      requestsColumns: null,
      requests: null,
      totalsupply: null,
      validatorbalance: null,
      mintamount: null,
      transferamount: null
    }
  },
  mounted() {
    this.validatorAccount();
    this.getRequests();
  },
  methods: {
    open(d) {
      if (d === 'mint') this.displayMint = true;
      if (d === 'transfer') this.displayTranfer = true
    },
    close() {
      this.displayMint = false;
      this.displayTranfer = false;
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
    validatorAccount() {
      axios.get('/api/validator')
          .then(res => {
            this.totalsupply = res.data.totalsupply;
            this.validatorbalance = res.data.balance;
          })
          .catch(e => {
            console.log(e.message);
          });
    },

    getRequests() {
      axios.get("/validator/creditrequests")
          .then((res) => {
            this.requests = res.data;
            this.requestsColumns = [
              {field: "code", header: "#"},
              {field: "memberid", header: "Member ID"},
              {field: "companyname", header: "Member"},
              {field: "projectid", header: "Certificate"},
              {field: "wallet", header: "Wallet"},
              {field: "date", header: "Date"},
              {field: "status", header: "Status"},
            ];
          })
          .catch(e => {
            console.log(e.message);
          });
    },

    mintTokens() {
      axios.post('/api/mint', {
            amount: this.mintamount
          }
      ).then(() => {
        this.successToast('Success', 'Tokens Minted');
        this.validatorAccount();
        this.close();
      }).catch(err => {
        console.log(err);
        this.errorToast('Error', 'An error occurred')
      })
    },
    transferTokens(data) {
      axios.post('/api/transfer', {
            memberid: data.memberid,
            amount: this.transferamount,
            walletaddress: data.wallet,
            code: data.code
          }
      ).then(() => {
        this.getRequests();
        this.validatorAccount();
        this.close();
        this.successToast('Success', 'Transfer Successful');
      }).catch(err => {
        console.log(err)
        this.errorToast("Error", `An error occurred`);
      })
    },
    declineRequest(data) {
      axios.post('/validator/decline',
          {
            memberid: data.memberid,
            code: data.code
          }
      ).then(() => {
        this.getRequests();
        this.validatorAccount();
        this.successToast("Success", `You declined the request`);
      }).catch(err => {
        console.log(err)
        this.errorToast("Error", `An error occurred`);
      })
    }
  }
};
</script>
