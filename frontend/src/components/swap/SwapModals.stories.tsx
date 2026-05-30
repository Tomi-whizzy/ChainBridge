import type { Meta, StoryObj } from "@storybook/react";
import { SwapReviewModal } from "./SwapReviewModal";
import { SwapSigningModal } from "./SwapSigningModal";
import { useState } from "react";
import { TransactionLifecycle } from "@/types";

const meta: Meta = {
  title: "Swap/Modals",
  parameters: {
    layout: "centered",
  },
};

export default meta;

// Dummy Payload for the modals
const mockSwapDetails = {
  fromAsset: "XLM",
  fromChain: "stellar",
  fromAmount: "100.5",
  toAsset: "BTC",
  toChain: "bitcoin",
  toAmount: "0.0021",
  estimatedFees: "0.00001 XLM",
  timelockHours: 24,
  route: "Stellar → Bitcoin",
  slippage: 0.5,
  expirationMinutes: 30,
};

// ==========================================
// Swap Review Modal Stories
// ==========================================

export const ReviewState: StoryObj<typeof SwapReviewModal> = {
  render: () => {
    return (
      <SwapReviewModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        isConfirming={false}
        swapDetails={mockSwapDetails}
      />
    );
  },
};

export const ReviewStateConfirming: StoryObj<typeof SwapReviewModal> = {
  render: () => {
    return (
      <SwapReviewModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        isConfirming={true}
        swapDetails={mockSwapDetails}
      />
    );
  },
};

// ==========================================
// Swap Signing Modal Stories
// ==========================================

const mockLifecycleInProgress: TransactionLifecycle = {
  currentStep: "sign",
  retryable: false,
  steps: [
    { key: "init", status: "completed", label: "Initialize Swap", description: "Creating swap request" },
    { key: "sign", status: "active", label: "Sign Transaction", description: "Waiting for wallet signature" },
    { key: "submit", status: "idle", label: "Submit to Network", description: "Broadcasting to network" },
  ],
};

const mockLifecycleFailed: TransactionLifecycle = {
  currentStep: "sign",
  retryable: true,
  steps: [
    { key: "init", status: "completed", label: "Initialize Swap", description: "Creating swap request" },
    { key: "sign", status: "error", label: "Sign Transaction", description: "User rejected request", errorMessage: "User rejected request" },
    { key: "submit", status: "idle", label: "Submit to Network", description: "Broadcasting to network" },
  ],
};

const mockLifecycleCompleted: TransactionLifecycle = {
  currentStep: "submit",
  retryable: false,
  steps: [
    { key: "init", status: "completed", label: "Initialize Swap", description: "Creating swap request" },
    { key: "sign", status: "completed", label: "Sign Transaction", description: "Waiting for wallet signature" },
    { key: "submit", status: "completed", label: "Submit to Network", description: "Broadcasting to network" },
  ],
};

export const SigningInProgress: StoryObj<typeof SwapSigningModal> = {
  render: () => {
    return (
      <SwapSigningModal
        open={true}
        onClose={() => {}}
        onCancel={() => {}}
        onRetry={() => {}}
        lifecycle={mockLifecycleInProgress}
      />
    );
  },
};

export const SigningFailed: StoryObj<typeof SwapSigningModal> = {
  render: () => {
    return (
      <SwapSigningModal
        open={true}
        onClose={() => {}}
        onCancel={() => {}}
        onRetry={() => {}}
        lifecycle={mockLifecycleFailed}
      />
    );
  },
};

export const SigningComplete: StoryObj<typeof SwapSigningModal> = {
  render: () => {
    return (
      <SwapSigningModal
        open={true}
        onClose={() => {}}
        onCancel={() => {}}
        onRetry={() => {}}
        lifecycle={mockLifecycleCompleted}
      />
    );
  },
};
