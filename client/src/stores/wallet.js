import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
    state: () => {
        return { walletData: null }
    },
    actions: {
        saveWalletData(payload) {
            this.walletData = payload
        },
    },
})
