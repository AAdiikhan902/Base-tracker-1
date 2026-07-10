"use client";

import { useState } from "react";

interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  tokenSymbol: string;
  value: string;
  tokenDecimal: string;
  timeStamp: string;
}

interface TrackedWalletData {
  address: string;
  nativeBalanceEth: string;
  transfers: TokenTransfer[];
