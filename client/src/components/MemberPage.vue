<template>
  <Toast position="top-right"/>
  <div class="grid">
    <div class="col-12" v-if="!dataloaded">

      <div class="grid grid-nogutter text-800">
        <div
            class="col-12 md:col-6 text-center md:text-left flex align-items-center"
        >
          <section>

            <div class="">
              <span class="text-4xl font-bold mb-1">How to access your account</span>

            </div>

            <div class="flex flex-column mt-6">
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> To access our platform, you'll need to connect your wallet first.</p>
          <p><i class="pi pi-check-circle text-green-800 mr-2"></i> This process involves signing a transaction containing zero algos in order to authenticate your account.</p>
          <p><i class="pi pi-check-circle text-green-800 mr-2"></i>  Once you've connected your wallet, you'll be able to log in and start using our services.</p>
            </div>

          </section>
        </div>

        <div
            class="col-12 md:col-6 overflow-hidden flex align-items-center justify-content-center"
        >
          <img
              :src="heroImage()"
              alt="Image"
              class="md:h-15rem md:w-fit"
              style="width: 100%"
          />
        </div>

      </div>
      <div class="grid grid-nogutter text-800">
        <div
            class="col-12 md:col-6 text-center md:text-left flex align-items-center"
        >
          <section>

            <div class="">
              <span class="text-4xl font-bold mb-1">Features</span>

            </div>

            <div class="flex flex-column mt-6">
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> Check balance</p>
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> Request credits</p>
              <p><i class="pi pi-check-circle text-green-800 mr-2"></i> Manage your account</p>
            </div>

          </section>
        </div>

        <div
            class="col-12 md:col-6 overflow-hidden flex align-items-center justify-content-center"
        >
   
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

          <!-- <template #footer> -->
          <!-- <Button label="Login" @click="authenticate" icon="pi pi-check" class="p-button-outlined"/> -->
        <!-- </template> -->
        </div>
      </div>
    </div>
    <div class="col-12 mt-5 " v-if="walletStore.walletData">
      <Button label="Login" id="login-button" icon="pi pi-wallet" @click="authenticate"/>
    </div>


    <div class="col-12 lg:col-6 xl:col-3" id="account_type"  v-if="dataloaded">
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

    <div class="col-12 lg:col-6 xl:col-3" id="balance" v-if="dataloaded">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Balance</span>
            <div class="text-900 font-medium text-xl">{{ accountbalance }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-blue-100 border-round"
               style="width:2.5rem;height:2.5rem">
            <i class="pi pi-wallet text-blue-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">CCT </span>
        <!--        <span class="text-500">Tokens</span>-->
      </div>
    </div>

    <div class="col-12 lg:col-6 xl:col-3" v-if="dataloaded"></div>

    <div class="col-12 md:col-3 flex justify-content-end align-items-end" v-if="dataloaded">
      <div v-if="membertype === 'seller'">
        <Dialog header="Request Form"
                v-model:visible="display"
                :breakpoints="{'960px': '75vw'}"
                :style="{width: '30vw'}" :modal="true">

          <div class=" p-fluid">
            <div class="col-12">
              <div class="p-inputgroup">
                    <span class="p-inputgroup-addon">
                        <i class="pi pi-user"></i>
                    </span>
                <InputText placeholder="Member ID"
                           type="number"
                           v-model="memberid"/>
              </div>
            </div>
          </div>

          <template #footer>
            <Button label="Request" @click="sendRequest" icon="pi pi-check" class="p-button-outlined"/>
          </template>
        </Dialog>
        <Button label="Request Credits" icon="pi pi-external-link" style="width: auto" @click="open"/>
      </div>
    </div>


    <div class="col-12" v-if="dataloaded && membertype === 'seller' ">
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

            <Column headerStyle="width:5rem">
              <template #body="slotProps">
                <div class="grid" style="min-width: 5rem;">
            
                  <Button class="p-button-danger p-button-icon-only ml-1" icon="pi pi-trash"
                          @click="deleteRequest(slotProps.data)"/>
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

// sandbox
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const algosdk = require('algosdk');
import {useWalletStore} from '@/stores/wallet'
const port = 4001;
let algodclient = new algosdk.Algodv2(token, server, port);
import { PeraWalletConnect } from "@perawallet/connect";
// import { setSendTransactionHeaders } from "algosdk/dist/types/client/v2/algod/sendRawTransaction";
const vendor_address = "NWR46NHXFRJBNTQCRCT2NTNYH57RUKSPYLVWZYN6BVLLLGTZTEPS5S6PHE"
// const public_key = "CK6IKHX2YTKF372EM653WSR4OOWN3BZLVBETXQEZV6TNE3HC5QF3MZ7RZA"
const peraWallet = new PeraWalletConnect({ 
  chainId: 416002,
  shouldShowSignTxnToast: true
 });
// console.log(walletStore)
export default {
  props: {
    title: String,
  },
  data() {
    return {
      display: false,
      displaySell : false,
      memberid: null,
      membertype: null,
      projectid: null,
      taxid: null,
      address: null,
      amount: null,
      accountbalance: null,
      dataloaded: false,
      requests: null,
      requestsColumns: null,
    }
  },
  setup() {
  const walletStore = useWalletStore();
  const peraWallet = new PeraWalletConnect({ chainId: 416002 });
  
  const connectWallet = async () => {
  
    // if(peraWallet.isConnected == false)
    // {  
      peraWallet
        .connect()
        .then((accounts) => {
          // peraWallet.connector.on("disconnect", this.disconnectWallet);
          const accountAddress = accounts[0];
          walletStore.saveWalletData(accountAddress);
          console.log("The connected account: ",accountAddress);

          return accountAddress;
          // this.successToast('Success', `You have successfully connected your wallet!`)
        })
        .catch((e) => console.log(e));
    }
    
  // };
  const disconnectWallet = async()=> {
      peraWallet.disconnect().then(() => (this.accountAddress = null));
    };
  return {
    connectWallet,
    walletStore,
    disconnectWallet
  };
},
mounted() {
  const peraWallet = new PeraWalletConnect({ chainId: 416002 });
  if (this.walletStore.walletData != null) {
    this.myAccount(this.walletStore.walletData);
    // this.marketAccount();
  }
  peraWallet
      .reconnectSession()
      // .then((accounts) => {
      // peraWallet.connector.on("disconnect", this.disconnectWallet);

      //   if (accounts.length) {
      //     this.accountAddress = accounts[0];
      //   }
      // })
      // .catch((error) => {
      //   if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
      //     console.log(error);
      //   }
      // });
},
  methods: {
    titleCase(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    successToast(s, d) {
      this.$toast.add({
        severity: "success",
        summary: s,
        detail: d,
        life: 4000,
      });
    },
    open() {
      this.display = true;
    },
    close() {
      this.display = false;
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
      return this.walletStore.walletData != null ? `You are connected: ${this.walletStore.walletData}` : 'Connect Wallet'
    },
    reset() {
      useWalletStore().$reset();
      var balance = document.getElementById("balance");
      var account_type = document.getElementById("account_type");
      // hide the login button by setting its display style property to "none"
      balance.style.display = "none";
      account_type.style.display = "none";
      console.log('Reset connection to wallet')
    },
    sendRequest() {
      const n = new Date();
      axios.post('/member/requestcredit', {
            memberid: this.memberid,
            date: `${n.getDate()}/${(n.getMonth() + 1)}/${n.getFullYear()}`
          }
      ).then(() => {
        // this.memberid = res.data.memberid;
        this.dataLoaded = true;
        this.successToast('Success', `Request successful`)
        this.myAccount(this.memberid);
        this.close();
      }).catch(err => {
        console.log(err)
        this.close();
        this.errorToast('Error', err.response.data)
      })
    },
//   async connectWallet() {
//   const walletStore = useWalletStore();
//   if(peraWallet.isConnected) {
//     console.log("Connect your wallet")
//     try {
//       const accounts = await peraWallet.connect();
//       const accountAddress = accounts[0];
//       walletStore.saveWalletData(accountAddress);
//       console.log("DApp connected to your wallet 💰");
//       console.log("The connected account: ",accountAddress);
//       this.successToast('Success', `You have successfully connected your wallet! Now authenticating..`)
//       return accountAddress;
//     } catch (e) {
//       console.log(e);
//       throw new Error("Failed to connect wallet");
//     }
//   }
// },
//   async disconnectWallet() {
//       peraWallet.disconnect().then(() => (this.accountAddress = null));
//   },
    //AUTHENTICATION
 async authenticate() {

  // Prompt the user to connect their wallet
  // window.alert("Please connect your wallet to continue!");
  // Wait for the wallet to connect before executing subsequent code
  // const accountAddress = await this.connectWallet();
  const accountAddress = this.walletStore.walletData;
  console.log("Ready??",accountAddress);

  // Update the wallet data in the store
  const public_key = accountAddress;
  console.log("Public address",public_key);

  // Use the updated public key variable to make the transaction
  const params = await algodclient.getTransactionParams().do();
  const recipient = vendor_address;
  const amount = 0;
  const note = algosdk.encodeObj({ message: `Authenticating ${public_key}` });
  const txn = algosdk.makePaymentTxnWithSuggestedParams(
    public_key,
    recipient,
    amount,
    undefined,
    note,
    params
  );
  const txnGroup = [{txn: txn, signers: [public_key]}];
  console.log("do we get here??", txnGroup)

  // Sign the transaction using the wallet
  const signedTransactions = await peraWallet.signTransaction([txnGroup]);
  console.log("Got here??")

  // Send the signed transaction to the Algorand network
  const xtx = await algodclient.sendRawTransaction(signedTransactions).do();
  console.log(`Transaction ID: ${xtx.txId}`);

  // Wait for confirmation of the transaction
  const confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);

  // Get the completed transaction
  console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
// check if user has been authenticated
  // select the login button element by its id
  var loginButton = document.getElementById("login-button");
  // hide the login button by setting its display style property to "none"
  loginButton.style.display = "none";

  this.successToast('Success', `Your identity has been confirmed!`);

  this.myAccount(public_key)
  
  // Use the updated public key variable to make the API request
  // axios.post('/api/myaccount', {
  //   walletaddress: public_key
  // }).then(res => {
  //   this.accountbalance = res.data.balance;
  //   this.membertype = res.data.membertype;
  //   this.projectid = res.data.projectid;
  //   this.taxid = res.data.taxid;
  //   this.dataloaded = true;
  // }).catch(err => {
  //   console.log(err.message)
  //   this.errorToast('Error', `Account not found`)
  // });

  
  // // Use the updated public key variable to call the myRequests function
  // this.myRequests(public_key);
},
    myAccount(walletaddress) {
      axios.post('/api/myaccount', {
        walletaddress : this.walletStore.walletData,
          }
      ).then(res => {
        this.accountbalance = res.data.balance;
        this.membertype = res.data.membertype;
        this.projectid = res.data.projectid;
        this.taxid = res.data.taxid;
        this.dataloaded = true;
      }).catch(err => {
        console.log(err.message)
        this.errorToast('Error', `Account not found`)
      })
      this.myRequests(walletaddress);
    },

    myRequests(memberid) {
      axios.post("/member/myrequests", {
            memberid: memberid
          }
      ).then((res) => {
        this.requests = res.data;
        this.requestsColumns = [
          {field: "code", header: "#"},
          {field: "memberid", header: "Member ID"},
          {field: "companyname", header: "Member"},
          {field: "wallet", header: "Wallet"},
          {field: "date", header: "Date"},
          {field: "status", header: "Status"},
        ];
      }).catch(e => {
        console.log(e.message);
      });
    },
    deleteRequest(data) {
      axios.post('/member/delete',
          {
            memberid: data.memberid,
            code: data.code
          }
      ).then(() => {
        this.myRequests(data.memberid);
        this.successToast("Success", `You deleted the request`);
      }).catch(err => {
        console.log(err)
        this.errorToast("Error", `An error occurred`);
      })
    }
  }
};
</script>