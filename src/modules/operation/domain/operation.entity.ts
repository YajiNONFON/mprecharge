import { NetworkType } from "../operation.dto";

// CONSTANTES

export const FEEXPAY_FEE_RATE = 0.017;
export const MIN_AMOUNT = 200;
export const MAX_AMOUNT = 100000;

export const EXPECTED_PHONE_LENGTHS: Record<string, number> = {
  "229": 13,
  "228": 11,
  "226": 11,
  "221": 12,
  "225": 13,
};

export const NETWORK_TO_COUNTRY: Record<NetworkType, string> = {
  mtn: "229",
  moov: "229",
  celtiis_bj: "229",
  moov_tg: "228",
  moov_bf: "226",
  orange_bf: "226",
  orange_sn: "221",
  mtn_ci: "225",
  moov_ci: "225",
  orange_ci: "225",
};

// CALCUL DES FRAIS

export interface FeeCalculation {
  desiredAmount: number;
  netAmount: number;
  fees: number;
}

export const calculateFees = (amount: number): FeeCalculation => {
  const desiredAmount = amount;
  const netAmount = Math.floor(desiredAmount / (1 + FEEXPAY_FEE_RATE));
  const fees = desiredAmount - netAmount;

  return { desiredAmount, netAmount, fees };
};

// VALIDATION MONTANT

export const isValidAmount = (amount: number): boolean => {
  return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
};

// FORMATAGE NUMÉRO DE TÉLÉPHONE

export const getCountryCode = (networkType: NetworkType): string | null => {
  return NETWORK_TO_COUNTRY[networkType] ?? null;
};

const formatBeninNumber = (phone: string): string => {
  if (phone.startsWith("01")) return "229" + phone;
  if (phone.startsWith("0")) return "22901" + phone.substring(1);
  return "22901" + phone;
};

const formatTogoNumber = (phone: string): string => {
  if (phone.startsWith("0")) phone = phone.substring(1);
  return "228" + phone;
};

const formatBurkinaNumber = (phone: string): string => {
  return "226" + phone;
};

const formatSenegalNumber = (phone: string): string => {
  if (phone.startsWith("0")) phone = phone.substring(1);
  return "221" + phone;
};

const formatIvoryCoastNumber = (phone: string): string => {
  if (phone.startsWith("225")) phone = phone.substring(3);
  if (!phone.startsWith("0")) phone = "0" + phone;
  return "225" + phone;
};

export interface PhoneFormatResult {
  formattedPhone: string;
  error?: string;
}

export const formatPhoneNumber = (
  phoneNumber: string,
  networkType: NetworkType,
): PhoneFormatResult => {
  let cleanPhone = phoneNumber
    .replace(/^\+/, "")
    .replace(/\s/g, "")
    .replace(/-/g, "");

  const countryCode = getCountryCode(networkType);

  if (!countryCode) {
    return {
      formattedPhone: "",
      error: `Type de réseau non supporté: ${networkType}`,
    };
  }

  if (cleanPhone.startsWith(countryCode)) {
    cleanPhone = cleanPhone.substring(countryCode.length);
  }

  let formattedPhone: string;

  switch (countryCode) {
    case "229":
      formattedPhone = formatBeninNumber(cleanPhone);
      break;
    case "228":
      formattedPhone = formatTogoNumber(cleanPhone);
      break;
    case "226":
      formattedPhone = formatBurkinaNumber(cleanPhone);
      break;
    case "221":
      formattedPhone = formatSenegalNumber(cleanPhone);
      break;
    case "225":
      formattedPhone = formatIvoryCoastNumber(cleanPhone);
      break;
    default:
      return {
        formattedPhone: "",
        error: `Pays non supporté: ${countryCode}`,
      };
  }

  // Validation longueur
  const expectedLength = EXPECTED_PHONE_LENGTHS[countryCode];
  if (formattedPhone.length !== expectedLength) {
    return {
      formattedPhone: "",
      error: `Format de numéro invalide. Attendu: ${expectedLength} chiffres. Reçu: ${formattedPhone.length}`,
    };
  }

  return { formattedPhone };
};
