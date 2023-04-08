<template>
  <Toast position="top-right"/>
  <div class="grid">

    <div class="col-12" v-if="walletStore.walletData === null">

      <div class="grid grid-nogutter text-800">
        <div
            class="col-12 md:col-6 text-center md:text-left flex align-items-center"
        >
          <section>

            <div class="">
              <span class="text-4xl font-bold mb-1">How to Trade</span>

            </div>

            <div class="flex flex-column mt-6">
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> Become a Member</p>
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> If seller, get validation, request credits and sell on exchange</p>
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> If buyer, connect wallet and buy credits</p>
            </div>

          </section>
        </div>
        <div
            class="col-12 md:col-6 overflow-hidden flex align-items-center justify-content-center"
        >
          <img
              :src="heroImage()"
              alt="Image"
              class="md:h-25rem md:w-fit"
              style="width: 100%"
          />
        </div>
      </div>

    </div>

    <div class="col-12">
      <div class="flex p-fluid">
        <div class="">
          <!--    :disabled="walletStore.walletData != null"      -->
          <Button
              v-if="walletStore.walletData === null"

              @click="connectWallet"
              class="" :label="getConnectionLabel()" icon="pi pi-wallet" style="width: auto"/>
          <p v-if="walletStore.walletData != null" class="text-xl text-green-800 mr-4"><i class="pi pi-wallet mr-3"></i>{{getConnectionLabel()}}</p>
        </div>

        <div style="min-width: 4rem" v-if="walletStore.walletData != null">
          <Button label="Reset" class="p-button-danger ml-2" icon="pi pi-times" style="width: auto" @click="reset"/>

        </div>
      </div>
    </div>

    <div class="col-12 lg:col-6 xl:col-3 mt-5" v-if="walletStore.walletData != null && membertype != null">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Account Type</span>
            <div class="text-900 font-medium text-xl">{{ titleCase(membertype) }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round"
               style="width:2.5rem;height:2.5rem">
            <i class="pi pi-users text-orange-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium"></span>
        <span class="text-500"></span>
      </div>
    </div>

    <div class="col-12 lg:col-6 xl:col-3 mt-5" v-if="walletStore.walletData != null &&  membertype === 'buyer'">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Available on Market</span>
            <div class="text-900 font-medium text-xl">{{ marketCCTbalance }}</div>
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

    <div class="col-12 lg:col-6 xl:col-3 mt-5" v-if="walletStore.walletData != null">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Your Balance</span>
            <div class="text-900 font-medium text-xl">{{ myCCTbalance }}</div>
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


    <div class="col-12 mt-5" v-if="walletStore.walletData != null && this.membertype ==='buyer'">
      <Dialog header="Buy" v-model:visible="displayBuy" :breakpoints="{'960px': '75vw'}"
              :style="{width: '30vw'}" :modal="true">

        <div class=" p-fluid">
          <div class="col-12">
            <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
              <InputText placeholder="Amount" type="number"
                         v-model="amount"/>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Buy" @click="buy" icon="pi pi-check" class="p-button-outlined"/>
        </template>
      </Dialog>
      <Button label="BUY" icon="pi pi-wallet" @click="open('buy')"/>
    </div>

    <div class="col-12 mt-5 " v-if="walletStore.walletData != null && this.membertype ==='seller'">
      <Dialog header="Sell" v-model:visible="displaySell" :breakpoints="{'960px': '75vw'}"
              :style="{width: '30vw'}" :modal="true">

        <div class=" p-fluid">
          <div class="col-12">
            <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
              <InputText placeholder="Amount" type="number"
                         v-model="amount"/>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Sell" @click="sell" icon="pi pi-check" class="p-button-outlined"/>
        </template>
      </Dialog>
      <Button label="SELL" icon="pi pi-wallet" @click="open('sell')"/>
    </div>
  </div>
</template>

<script>
import {useWalletStore} from '@/stores/wallet'
import Web3 from "web3";

let web3 = new Web3(window.ethereum);

import CarbonCreditToken from "@/artifacts/CarbonCreditToken.json"
import Vendor from "@/artifacts/Vendor.json"
import axios from "axios";

export default {
  props: {
    title: String,
  },
  data() {
    return {
      amount: 0,
      displayBuy: false,
      displaySell: false,
      myCCTbalance: null,
      marketCCTbalance: null,
      membertype: null,
      projectid: null,
      taxid: null,
    }
  },
  setup() {
    const walletStore = useWalletStore()

    const connectWallet = async () => {
      try {
        const data = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        console.log('data :>> ', data)
        // this.userAddress = data[0]
        walletStore.saveWalletData(data[0])
        this.membertype = null;
        console.log('DApp connected to your wallet 💰')
      } catch (error) {
        console.error('Error connecting DApp to your wallet')
      }
    }
    return {
      connectWallet,
      walletStore,
    }
  },
  mounted() {
    if (this.walletStore.walletData != null) {
      this.myAccount(useWalletStore().walletData);
      this.marketAccount();
    }
  },
  methods: {
    open(d) {
      if (d === 'sell') this.displaySell = true;
      if (d === 'buy') this.displayBuy = true
    },
    close() {
      this.displaySell = false;
      this.displayBuy = false;
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
    heroImage() {
      return this.$appState.darkTheme
          ? "images/img_1.png"
          : "images/img_1.png";
    },
    getConnectionLabel() {
      return this.walletStore.walletData != null ? `${this.walletStore.walletData}` : 'Connect Wallet'
    },
    async buy() {
      this.close();
      try {
        const accounts = await web3.eth.getAccounts();
        const vendor = new web3.eth.Contract(
            Vendor.abi,
            process.env.VUE_APP_VENDOR_CONTRACT_ADDRESS
        );
        const request = await vendor.methods.buyTokens().send({
          from: accounts[0],
          value: web3.utils.toWei((this.amount / 100).toString(), "ether"),
        });

        this.successToast('Success', `You have purchased ${this.amount} CCT tokens`)
        await this.myAccount(useWalletStore().walletData);
        await this.marketAccount();
        // alert("You have successfully purchased CCT tokens!");
        console.log(request);
      } catch (err) {
        console.error(err);
        // alert("Error purchasing tokens");
        this.errorToast('Error', 'Error purchasing tokens')
      }
    },
    async sell() {
      this.close();
      try {
        const accounts = await web3.eth.getAccounts();
        console.log(`your account ${accounts[0]}`)
        const tokenContract = new web3.eth.Contract(
            CarbonCreditToken.abi,
            process.env.VUE_APP_TOKEN_CONTRACT_ADDRESS
        );
        // Approve the contract to spend the tokens
        let request = await tokenContract.methods
            .approve(
                process.env.VUE_APP_VENDOR_CONTRACT_ADDRESS,
                web3.utils.toWei(this.amount, "ether")
            )
            .send({
              from: accounts[0],
            });

        // Trigger the selling of tokens
        const vendor = new web3.eth.Contract(
            Vendor.abi,
            process.env.VUE_APP_VENDOR_CONTRACT_ADDRESS
        );
        request = await vendor.methods
            .sellTokens(web3.utils.toWei(this.amount, "ether"))
            .send({
              from: accounts[0],
            });

        // alert("You have successfully sold CCT tokens!");
        this.successToast('Success', `You have sold ${this.amount} CCT tokens!`)
        await this.myAccount(useWalletStore().walletData);
        await this.marketAccount();
        console.log(request);
      } catch (err) {
        console.error(err);
        // alert("Error selling tokens");
        this.errorToast('Error', 'Error selling tokens')
      }
    },
    reset() {
      useWalletStore().$reset();
      console.log('Reset connection to wallet')
    },
    titleCase(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    async myAccount(wallet) {

      try {
        const accounts = await web3.eth.getAccounts();
        console.log(`your account ${accounts[0]}`)
        const tokenContract = new web3.eth.Contract(
            CarbonCreditToken.abi,
            process.env.VUE_APP_TOKEN_CONTRACT_ADDRESS
        );

        const val = await tokenContract.methods
            .balanceOf(wallet)
            .call();

        this.myCCTbalance = val / 10 ** 18

        axios.post('/member/registrationdata', {
          walletaddress: wallet
            }
        ).then(res => {
          this.membertype = res.data.membertype;
          this.projectid = res.data.projectid;
          this.taxid = res.data.taxid;
        }).catch(err => {
          console.log(err.message)
          // this.errorToast('Error', `Account not found`)
          this.membertype = null;
        })

      } catch (e) {
        this.errorToast('Error', 'Error retrieving balance')
      }
    },
    async marketAccount() {

      try {
        // const accounts = await web3.eth.getAccounts();
        // console.log(`your account ${accounts[0]}`)
        const tokenContract = new web3.eth.Contract(
            CarbonCreditToken.abi,
            process.env.VUE_APP_TOKEN_CONTRACT_ADDRESS
        );

        const val = await tokenContract.methods
            .balanceOf(process.env.VUE_APP_VENDOR_CONTRACT_ADDRESS)
            .call();

        this.marketCCTbalance = val / 10 ** 18

      } catch (e) {
        this.errorToast('Error', 'Error retrieving balance')
      }
    }
  },
  computed: {
    accAvailable() {
      return useWalletStore().walletData
    },
  },
  watch: {
    async accAvailable(newVal, old) {
      console.log(`updating from ${old} to ${newVal}`)
      if (newVal) {
        await this.myAccount(newVal);
        await this.marketAccount();
      }
    },
  },
};
</script>



