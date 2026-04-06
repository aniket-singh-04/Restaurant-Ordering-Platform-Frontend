import type {
  RestaurantPaymentConnectionOnboardingPayload,
  SupportedPaymentConnectionBusinessType,
} from "./api";
import { isValidEmail, isValidGst, isValidPhone } from "../../utils/validators";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^[0-9]{6,18}$/;
const POSTAL_CODE_REGEX = /^[1-9][0-9]{5}$/;
const MAX_ADDRESS_LENGTH = 160;
const MAX_CITY_LENGTH = 80;
const MAX_STATE_LENGTH = 80;
const MAX_NAME_LENGTH = 120;
const MAX_BUSINESS_NAME_LENGTH = 255;

export const PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS: Array<{
  value: SupportedPaymentConnectionBusinessType;
  label: string;
  description: string;
}> = [
  {
    value: "proprietorship",
    label: "Proprietorship",
    description: "Use the proprietor PAN. A separate business PAN is not required.",
  },
  {
    value: "partnership",
    label: "Partnership",
    description: "Use the partnership firm PAN and the partner stakeholder details.",
  },
];

const normalizeWhitespace = (value: string) =>
  value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

const normalizeOptionalText = (value?: string | null) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || undefined;
};

const normalizeDigits = (value: string) => value.replace(/\D/g, "");
const normalizeUppercaseCode = (value: string) => normalizeWhitespace(value).toUpperCase();

const getEffectiveBusinessPan = (
  form: RestaurantPaymentConnectionOnboardingPayload,
) =>
  form.businessType === "proprietorship"
    ? form.legalInfo.pan ?? form.stakeholder.pan
    : form.legalInfo.pan;

export const createPaymentConnectionForm = (
  user: { name?: string; email?: string; phone?: string } | null | undefined,
): RestaurantPaymentConnectionOnboardingPayload => ({
  businessType: "proprietorship",
  businessCategory: "food",
  businessSubcategory: "restaurant",
  customerFacingBusinessName: "",
  businessAddress: {
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  },
  legalInfo: {
    pan: "",
    gst: "",
  },
  bankAccount: {
    accountNumber: "",
    ifscCode: "",
    beneficiaryName: user?.name ?? "",
  },
  stakeholder: {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    pan: "",
    percentageOwnership: 100,
    address: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    },
  },
  acceptTerms: false,
});

export const sanitizePaymentConnectionForm = (
  form: RestaurantPaymentConnectionOnboardingPayload,
): RestaurantPaymentConnectionOnboardingPayload => {
  const businessType = form.businessType === "partnership" ? "partnership" : "proprietorship";
  const legalPan = normalizeOptionalText(form.legalInfo.pan);
  const gst = normalizeOptionalText(form.legalInfo.gst);

  return {
    businessType,
    businessCategory: "food",
    businessSubcategory: "restaurant",
    customerFacingBusinessName: normalizeOptionalText(form.customerFacingBusinessName),
    businessAddress: {
      street1: normalizeWhitespace(form.businessAddress.street1),
      street2: normalizeOptionalText(form.businessAddress.street2),
      city: normalizeWhitespace(form.businessAddress.city),
      state: normalizeWhitespace(form.businessAddress.state),
      postalCode: normalizeDigits(form.businessAddress.postalCode).slice(0, 6),
      country: "IN",
    },
    legalInfo: {
      pan: legalPan ? normalizeUppercaseCode(legalPan) : undefined,
      gst: gst ? normalizeUppercaseCode(gst) : undefined,
    },
    bankAccount: {
      accountNumber: normalizeDigits(form.bankAccount.accountNumber).slice(0, 18),
      ifscCode: normalizeUppercaseCode(form.bankAccount.ifscCode),
      beneficiaryName: normalizeWhitespace(form.bankAccount.beneficiaryName),
    },
    stakeholder: {
      name: normalizeWhitespace(form.stakeholder.name),
      email: normalizeWhitespace(form.stakeholder.email).toLowerCase(),
      phone: normalizeDigits(form.stakeholder.phone).slice(0, 10),
      pan: normalizeUppercaseCode(form.stakeholder.pan),
      percentageOwnership:
        businessType === "proprietorship"
          ? 100
          : Number.isFinite(form.stakeholder.percentageOwnership)
            ? Math.trunc(form.stakeholder.percentageOwnership)
            : 0,
      address: {
        street1: normalizeWhitespace(form.stakeholder.address.street1),
        street2: normalizeOptionalText(form.stakeholder.address.street2),
        city: normalizeWhitespace(form.stakeholder.address.city),
        state: normalizeWhitespace(form.stakeholder.address.state),
        postalCode: normalizeDigits(form.stakeholder.address.postalCode).slice(0, 6),
        country: "IN",
      },
    },
    acceptTerms: Boolean(form.acceptTerms),
  };
};

export const buildPaymentConnectionPayload = (
  form: RestaurantPaymentConnectionOnboardingPayload,
): RestaurantPaymentConnectionOnboardingPayload => {
  const sanitizedForm = sanitizePaymentConnectionForm(form);

  return {
    ...sanitizedForm,
    legalInfo: {
      ...sanitizedForm.legalInfo,
      pan:
        sanitizedForm.businessType === "partnership"
          ? getEffectiveBusinessPan(sanitizedForm)
          : undefined,
    },
  };
};

export const validatePaymentConnectionForm = (
  form: RestaurantPaymentConnectionOnboardingPayload,
) => {
  const sanitizedForm = sanitizePaymentConnectionForm(form);
  const errors: Record<string, string> = {};
  const setError = (field: string, message: string) => {
    if (!errors[field]) {
      errors[field] = message;
    }
  };

  if (!PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS.some((option) => option.value === sanitizedForm.businessType)) {
    setError("businessType", "Choose either proprietorship or partnership.");
  }

  if (sanitizedForm.customerFacingBusinessName) {
    if (sanitizedForm.customerFacingBusinessName.length < 2) {
      setError(
        "customerFacingBusinessName",
        "Customer-facing business name must be at least 2 characters.",
      );
    }

    if (sanitizedForm.customerFacingBusinessName.length > MAX_BUSINESS_NAME_LENGTH) {
      setError(
        "customerFacingBusinessName",
        `Customer-facing business name must be ${MAX_BUSINESS_NAME_LENGTH} characters or fewer.`,
      );
    }

    if (/(https?:\/\/|www\.|<|>|mailto:)/i.test(sanitizedForm.customerFacingBusinessName)) {
      setError(
        "customerFacingBusinessName",
        "Customer-facing business name cannot include links or markup.",
      );
    }
  }

  if (
    sanitizedForm.businessAddress.street1.length < 3 ||
    sanitizedForm.businessAddress.street1.length > MAX_ADDRESS_LENGTH
  ) {
    setError("businessAddress.street1", "Business address is required.");
  }

  if (
    sanitizedForm.businessAddress.city.length < 2 ||
    sanitizedForm.businessAddress.city.length > MAX_CITY_LENGTH
  ) {
    setError("businessAddress.city", "Business city is required.");
  }

  if (
    sanitizedForm.businessAddress.state.length < 2 ||
    sanitizedForm.businessAddress.state.length > MAX_STATE_LENGTH
  ) {
    setError("businessAddress.state", "Business state is required.");
  }

  if (!POSTAL_CODE_REGEX.test(sanitizedForm.businessAddress.postalCode)) {
    setError("businessAddress.postalCode", "Business postal code must be a valid 6-digit PIN code.");
  }

  if (!PAN_REGEX.test(sanitizedForm.stakeholder.pan)) {
    setError("stakeholder.pan", "Enter a valid stakeholder PAN.");
  }

  if (sanitizedForm.businessType === "partnership") {
    if (!sanitizedForm.legalInfo.pan || !PAN_REGEX.test(sanitizedForm.legalInfo.pan)) {
      setError("legalInfo.pan", "Enter a valid business PAN for partnership onboarding.");
    }
  } else if (
    sanitizedForm.legalInfo.pan &&
    sanitizedForm.legalInfo.pan !== sanitizedForm.stakeholder.pan
  ) {
    setError(
      "legalInfo.pan",
      "For proprietorship, the proprietor PAN must match the stakeholder PAN.",
    );
  }

  if (sanitizedForm.legalInfo.gst && !isValidGst(sanitizedForm.legalInfo.gst)) {
    setError("legalInfo.gst", "Enter a valid GST number.");
  }

  const effectiveBusinessPan = getEffectiveBusinessPan(sanitizedForm);
  if (
    sanitizedForm.legalInfo.gst &&
    effectiveBusinessPan &&
    sanitizedForm.legalInfo.gst.slice(2, 12) !== effectiveBusinessPan
  ) {
    setError(
      "legalInfo.gst",
      "GST number must belong to the same PAN used for the business.",
    );
  }

  if (!ACCOUNT_NUMBER_REGEX.test(sanitizedForm.bankAccount.accountNumber)) {
    setError("bankAccount.accountNumber", "Account number must be 6-18 digits.");
  }

  if (!IFSC_REGEX.test(sanitizedForm.bankAccount.ifscCode)) {
    setError("bankAccount.ifscCode", "Enter a valid IFSC code.");
  }

  if (
    sanitizedForm.bankAccount.beneficiaryName.length < 2 ||
    sanitizedForm.bankAccount.beneficiaryName.length > MAX_NAME_LENGTH
  ) {
    setError("bankAccount.beneficiaryName", "Beneficiary name is required.");
  }

  if (
    sanitizedForm.stakeholder.name.length < 2 ||
    sanitizedForm.stakeholder.name.length > MAX_NAME_LENGTH
  ) {
    setError("stakeholder.name", "Stakeholder name is required.");
  }

  if (!isValidEmail(sanitizedForm.stakeholder.email)) {
    setError("stakeholder.email", "Enter a valid stakeholder email.");
  }

  if (!isValidPhone(sanitizedForm.stakeholder.phone)) {
    setError("stakeholder.phone", "Stakeholder phone must be exactly 10 digits.");
  }

  if (
    !Number.isFinite(sanitizedForm.stakeholder.percentageOwnership) ||
    sanitizedForm.stakeholder.percentageOwnership < 1 ||
    sanitizedForm.stakeholder.percentageOwnership > 100
  ) {
    setError(
      "stakeholder.percentageOwnership",
      "Ownership percentage must be between 1 and 100.",
    );
  }

  if (
    sanitizedForm.businessType === "proprietorship" &&
    sanitizedForm.stakeholder.percentageOwnership !== 100
  ) {
    setError(
      "stakeholder.percentageOwnership",
      "Ownership must be 100% for proprietorship onboarding.",
    );
  }

  if (
    sanitizedForm.stakeholder.address.street1.length < 3 ||
    sanitizedForm.stakeholder.address.street1.length > MAX_ADDRESS_LENGTH
  ) {
    setError("stakeholder.address.street1", "Stakeholder address is required.");
  }

  if (
    sanitizedForm.stakeholder.address.city.length < 2 ||
    sanitizedForm.stakeholder.address.city.length > MAX_CITY_LENGTH
  ) {
    setError("stakeholder.address.city", "Stakeholder city is required.");
  }

  if (
    sanitizedForm.stakeholder.address.state.length < 2 ||
    sanitizedForm.stakeholder.address.state.length > MAX_STATE_LENGTH
  ) {
    setError("stakeholder.address.state", "Stakeholder state is required.");
  }

  if (!POSTAL_CODE_REGEX.test(sanitizedForm.stakeholder.address.postalCode)) {
    setError(
      "stakeholder.address.postalCode",
      "Stakeholder postal code must be a valid 6-digit PIN code.",
    );
  }

  if (!sanitizedForm.acceptTerms) {
    setError(
      "acceptTerms",
      "Accept the Razorpay Route onboarding terms before submitting.",
    );
  }

  return {
    sanitizedForm,
    errors,
  };
};
