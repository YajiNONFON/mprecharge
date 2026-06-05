export type PaymentGateway = "FEEXPAY" | "FEDAPAY";

export interface DepositInput {
  serviceId: string;
  amount: number;
  networkType: string;
  paymentNumber: string;
  accountId?: string;
}

export interface WithdrawalInput {
  serviceId: string;
  amount: number;
  networkType: string;
  receiverNumber: string;
  receiverFullName: string;
  withdrawalCode?: string;
  accountId?: string;
}

export interface DepositResponse {
  id: string;
  transpublicId: string;
  gatewayReference: string;
  amount: number;
  status: string;
}

export interface WithdrawalResponse {
  id: string;
  transpublicId: string;
  amount: number;
  status: string;
}

export interface PollingOptions {
  transactionId: string;
  gatewayRef: string;
  serviceName: string;
  accountId: string;
  userId: string;
  serviceId: string;
  desiredAmount: number;
  clientFullName: string;
  phoneNumber: string;
  gateway: PaymentGateway;
}
