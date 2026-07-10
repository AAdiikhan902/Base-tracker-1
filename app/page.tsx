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
  uniqueTokens: string[];
  flags: {
    whaleTransfers: { symbol: string; amount: number; usd: number | null; hash: string }[];
    highFrequency: boolean;
    recentTxCount24h: number;
  };
  aiSummary: string;
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function CornerMarks() {
  return (
    <>
      <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-base-blue" />
      <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-base-blue" />
      <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-base-blue" />
      <span className="absolute bottom-0 right-0
