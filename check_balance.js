async function requestAdditionalTokens() {
  const txnParams = await algodClient.getTransactionParams().do();
  const suggestedFeePerByte = 10;
  const amount = 100; // number of tokens to request
  const note = algosdk.encodeObj({ message: "Token request from seller" });
  const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: "<validator-address>",
    amount,
    assetIndex: assetID,
    suggestedFeePerByte,
    note,
  }, txnParams);
  const signedTxn = assetTransferTxn.signTxn(account.sk);
  const txId = await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`Token request transaction ID: ${txId}`);
  // Get the list of pending token requests
  const pendingRequests = await algodClient.pendingTransactionInformation(txnParams.lastRound).do();
  // Filter the list to show only the asset transfer transactions with the correct asset ID and note message
  const filteredRequests = pendingRequests['pending-transactions'].filter(txn => {
    return (txn['txn']['type'] === 'axfer' && txn['txn']['asset-id'] === assetID && txn['txn']['note'] === note);
  });
  // If there are no pending requests, return
  if (filteredRequests.length === 0) {
    console.log('There are no pending token requests.');
    return;
  }
  // Display the list of pending requests to the vendor
  console.log(`There are ${filteredRequests.length} pending token requests.`);
  filteredRequests.forEach((txn, index) => {
    console.log(`${index + 1}. Requested amount: ${txn['txn']['amount']} from address ${txn['txn']['from']}.`);
  });
  // Prompt the vendor to select a request to approve or decline
  const selectedRequestIndex = await prompt('Enter the number of the request to approve or decline: ');
  // Get the selected request
  const selectedRequest = filteredRequests[selectedRequestIndex - 1];
  // Prompt the vendor to approve or decline the selected request
  const approved = await prompt('Approve (Y/N): ');
  // If the request is approved, create and send the asset transfer transaction to send the requested tokens to the seller
  if (approved.toUpperCase() === 'Y') {
    const sellerAddress = selectedRequest['txn']['from'];
    const sellerNote = algosdk.encodeObj({ message: "Token request approved by vendor" });
    const sellerAssetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: "<validator-address>",
      to: sellerAddress,
      amount: selectedRequest['txn']['amount'],
      assetIndex: assetID,
      suggestedFeePerByte,
      note: sellerNote,
    }, txnParams);
    const sellerSignedTxn = sellerAssetTransferTxn.signTxn(validatorAccount.sk);
    const sellerTxId = await algodClient.sendRawTransaction(sellerSignedTxn).do();
    console.log(`Token transfer transaction ID: ${sellerTxId}`);
  }
  else {
    console.log('Token request declined.');
  }
}