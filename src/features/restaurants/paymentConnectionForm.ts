import type {
  RestaurantPaymentConnectionOnboardingPayload,
  SupportedPaymentConnectionBusinessType,
} from "./api";
import { isValidEmail, isValidGst } from "../../utils/validators";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const BUSINESS_PAN_FOURTH_CHAR_REGEX = /^[A-Z]{3}[CHFATBJGL]/;
const STAKEHOLDER_PAN_FOURTH_CHAR_REGEX = /^[A-Z]{3}P/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^[0-9]{5,20}$/;
const POSTAL_CODE_REGEX = /^[1-9][0-9]{5}$/;
const LINKED_ACCOUNT_ADDRESS_MAX_LENGTH = 100;
const LINKED_ACCOUNT_CITY_MAX_LENGTH = 100;
const LINKED_ACCOUNT_STATE_MAX_LENGTH = 32;
const STAKEHOLDER_NAME_MAX_LENGTH = 255;
const STAKEHOLDER_EMAIL_MAX_LENGTH = 132;
const STAKEHOLDER_ADDRESS_MAX_LENGTH = 255;
const STAKEHOLDER_CITY_MAX_LENGTH = 32;
const STAKEHOLDER_STATE_MAX_LENGTH = 32;
const STAKEHOLDER_POSTAL_CODE_MAX_LENGTH = 10;
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

const buildSingleStakeholderStreet = (...values: Array<unknown>) => {
  const normalizedValues = values
    .flatMap((value) =>
      typeof value === "string" ? [normalizeOptionalText(value)] : [],
    )
    .filter((value): value is string => Boolean(value));
  return normalizedValues.length > 0 ? normalizedValues.join(", ") : undefined;
};

const normalizeLegacyStakeholderAddress = (
  value: unknown,
): Partial<RestaurantPaymentConnectionOnboardingPayload["stakeholder"]["address"]> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const street1 = record.street1;
  const street2 = record.street2;

  const street =
    typeof record.street === "string" ? normalizeOptionalText(record.street) : undefined;
  const normalizedStreet = street ?? buildSingleStakeholderStreet(street1, street2);

  return {
    ...(normalizedStreet ? { street: normalizedStreet } : {}),
    ...(typeof record.city === "string" ? { city: record.city } : {}),
    ...(typeof record.state === "string" ? { state: record.state } : {}),
    ...(typeof record.postalCode === "string" ? { postalCode: record.postalCode } : {}),
    ...(typeof record.country === "string" ? { country: record.country } : {}),
  };
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
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    },
  },
  acceptTerms: false,
});

export const hydratePaymentConnectionForm = (
  user: { name?: string; email?: string; phone?: string } | null | undefined,
  savedPayload?: RestaurantPaymentConnectionOnboardingPayload | null,
): RestaurantPaymentConnectionOnboardingPayload => {
  const baseForm = createPaymentConnectionForm(user);
  const savedStakeholderAddress = normalizeLegacyStakeholderAddress(
    savedPayload?.stakeholder?.address,
  );

  if (!savedPayload) {
    return sanitizePaymentConnectionForm(baseForm);
  }

  return sanitizePaymentConnectionForm({
    ...baseForm,
    businessType: savedPayload.businessType ?? baseForm.businessType,
    businessCategory: savedPayload.businessCategory ?? baseForm.businessCategory,
    businessSubcategory: savedPayload.businessSubcategory ?? baseForm.businessSubcategory,
    customerFacingBusinessName:
      savedPayload.customerFacingBusinessName ?? baseForm.customerFacingBusinessName,
    businessAddress: {
      ...baseForm.businessAddress,
      ...(savedPayload.businessAddress ?? {}),
    },
    legalInfo: {
      ...baseForm.legalInfo,
      ...(savedPayload.legalInfo ?? {}),
    },
    bankAccount: {
      ...baseForm.bankAccount,
      ...(savedPayload.bankAccount ?? {}),
    },
    stakeholder: {
      ...baseForm.stakeholder,
      ...(savedPayload.stakeholder ?? {}),
      percentageOwnership: Number.isFinite(savedPayload.stakeholder?.percentageOwnership)
        ? Number(savedPayload.stakeholder.percentageOwnership)
        : baseForm.stakeholder.percentageOwnership,
      address: {
        ...baseForm.stakeholder.address,
        ...savedStakeholderAddress,
      },
    },
    acceptTerms: savedPayload.acceptTerms ?? baseForm.acceptTerms,
  });
};

export const sanitizePaymentConnectionForm = (
  form: RestaurantPaymentConnectionOnboardingPayload,
): RestaurantPaymentConnectionOnboardingPayload => {
  const businessType = form.businessType === "partnership" ? "partnership" : "proprietorship";
  const legalPan = normalizeOptionalText(form.legalInfo.pan);
  const gst = normalizeOptionalText(form.legalInfo.gst);
  const stakeholderAddress = normalizeLegacyStakeholderAddress(form.stakeholder.address);

  return {
    businessType,
    businessCategory: "food",
    businessSubcategory: "restaurant",
    customerFacingBusinessName: normalizeOptionalText(form.customerFacingBusinessName),
    businessAddress: {
      street1: normalizeWhitespace(form.businessAddress.street1 ?? ""),
      street2: normalizeOptionalText(form.businessAddress.street2),
      city: normalizeWhitespace(form.businessAddress.city ?? ""),
      state: normalizeWhitespace(form.businessAddress.state ?? ""),
      postalCode: normalizeDigits(form.businessAddress.postalCode ?? "").slice(0, 6),
      country: "IN",
    },
    legalInfo: {
      pan: legalPan ? normalizeUppercaseCode(legalPan) : undefined,
      gst: gst ? normalizeUppercaseCode(gst) : undefined,
    },
    bankAccount: {
      accountNumber: normalizeDigits(form.bankAccount.accountNumber ?? "").slice(0, 20),
      ifscCode: normalizeUppercaseCode(form.bankAccount.ifscCode ?? ""),
      beneficiaryName: normalizeWhitespace(form.bankAccount.beneficiaryName ?? ""),
    },
    stakeholder: {
      name: normalizeWhitespace(form.stakeholder.name ?? ""),
      email: normalizeWhitespace(form.stakeholder.email ?? "").toLowerCase(),
      phone: normalizeDigits(form.stakeholder.phone ?? "").slice(0, 11),
      pan: normalizeUppercaseCode(form.stakeholder.pan ?? ""),
      percentageOwnership:
        businessType === "proprietorship"
          ? 100
          : Number.isFinite(form.stakeholder.percentageOwnership)
            ? Number(form.stakeholder.percentageOwnership)
            : 0,
      address: {
        street: normalizeWhitespace(stakeholderAddress.street ?? ""),
        city: normalizeWhitespace(stakeholderAddress.city ?? ""),
        state: normalizeWhitespace(stakeholderAddress.state ?? ""),
        postalCode: normalizeDigits(stakeholderAddress.postalCode ?? "").slice(0, 10),
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
    if (sanitizedForm.customerFacingBusinessName.length > MAX_BUSINESS_NAME_LENGTH) {
      setError(
        "customerFacingBusinessName",
        `Customer-facing business name must be ${MAX_BUSINESS_NAME_LENGTH} characters or fewer.`,
      );
    }
  }

  if (
    sanitizedForm.businessAddress.street1.length < 1 ||
    sanitizedForm.businessAddress.street1.length > LINKED_ACCOUNT_ADDRESS_MAX_LENGTH
  ) {
    setError("businessAddress.street1", "Business address is required.");
  }

  if (
    sanitizedForm.businessAddress.city.length < 1 ||
    sanitizedForm.businessAddress.city.length > LINKED_ACCOUNT_CITY_MAX_LENGTH
  ) {
    setError("businessAddress.city", "Business city is required.");
  }

  if (
    sanitizedForm.businessAddress.state.length < 2 ||
    sanitizedForm.businessAddress.state.length > LINKED_ACCOUNT_STATE_MAX_LENGTH
  ) {
    setError("businessAddress.state", "Business state is required.");
  }

  if (!POSTAL_CODE_REGEX.test(sanitizedForm.businessAddress.postalCode)) {
    setError("businessAddress.postalCode", "Business postal code must be a valid 6-digit PIN code.");
  }

  if (!PAN_REGEX.test(sanitizedForm.stakeholder.pan)) {
    setError("stakeholder.pan", "Enter a valid stakeholder PAN.");
  } else if (!STAKEHOLDER_PAN_FOURTH_CHAR_REGEX.test(sanitizedForm.stakeholder.pan)) {
    setError("stakeholder.pan", "Stakeholder PAN must have P as the fourth character.");
  }

  if (sanitizedForm.businessType === "partnership") {
    if (!sanitizedForm.legalInfo.pan || !PAN_REGEX.test(sanitizedForm.legalInfo.pan)) {
      setError("legalInfo.pan", "Enter a valid business PAN for partnership onboarding.");
    } else if (!BUSINESS_PAN_FOURTH_CHAR_REGEX.test(sanitizedForm.legalInfo.pan)) {
      setError("legalInfo.pan", "Business PAN must use a supported fourth character.");
    }
  }

  if (sanitizedForm.legalInfo.gst && !isValidGst(sanitizedForm.legalInfo.gst)) {
    setError("legalInfo.gst", "Enter a valid GST number.");
  }

  if (!ACCOUNT_NUMBER_REGEX.test(sanitizedForm.bankAccount.accountNumber)) {
    setError("bankAccount.accountNumber", "Account number must be between 5 and 20 digits.");
  }

  if (!IFSC_REGEX.test(sanitizedForm.bankAccount.ifscCode)) {
    setError("bankAccount.ifscCode", "Enter a valid IFSC code.");
  }

  if (sanitizedForm.bankAccount.beneficiaryName.length < 1) {
    setError("bankAccount.beneficiaryName", "Beneficiary name is required.");
  }

  if (
    sanitizedForm.stakeholder.name &&
    sanitizedForm.stakeholder.name.length > STAKEHOLDER_NAME_MAX_LENGTH
  ) {
    setError(
      "stakeholder.name",
      `Stakeholder name must be ${STAKEHOLDER_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  if (
    sanitizedForm.stakeholder.email.length > STAKEHOLDER_EMAIL_MAX_LENGTH ||
    !isValidEmail(sanitizedForm.stakeholder.email)
  ) {
    setError("stakeholder.email", "Enter a valid stakeholder email.");
  }

  if (
    sanitizedForm.stakeholder.phone &&
    !/^[0-9]{8,11}$/.test(sanitizedForm.stakeholder.phone)
  ) {
    setError("stakeholder.phone", "Stakeholder phone must be 8 to 11 digits.");
  }

  if (
    sanitizedForm.stakeholder.percentageOwnership > 0 &&
    (!Number.isFinite(sanitizedForm.stakeholder.percentageOwnership) ||
      sanitizedForm.stakeholder.percentageOwnership > 100 ||
      Math.round(sanitizedForm.stakeholder.percentageOwnership * 100) !==
        sanitizedForm.stakeholder.percentageOwnership * 100)
  ) {
    setError(
      "stakeholder.percentageOwnership",
      "Ownership percentage must be 100 or less and can have at most 2 decimal places.",
    );
  }

  if (
    sanitizedForm.stakeholder.address.street &&
    (sanitizedForm.stakeholder.address.street.length < 10 ||
      sanitizedForm.stakeholder.address.street.length > STAKEHOLDER_ADDRESS_MAX_LENGTH)
  ) {
    setError("stakeholder.address.street", "Stakeholder street address must be 10 to 255 characters.");
  }

  if (
    sanitizedForm.stakeholder.address.city &&
    (sanitizedForm.stakeholder.address.city.length < 2 ||
      sanitizedForm.stakeholder.address.city.length > STAKEHOLDER_CITY_MAX_LENGTH)
  ) {
    setError("stakeholder.address.city", "Stakeholder city must be 2 to 32 characters.");
  }

  if (
    sanitizedForm.stakeholder.address.state &&
    (sanitizedForm.stakeholder.address.state.length < 2 ||
      sanitizedForm.stakeholder.address.state.length > STAKEHOLDER_STATE_MAX_LENGTH)
  ) {
    setError("stakeholder.address.state", "Stakeholder state must be 2 to 32 characters.");
  }

  if (
    sanitizedForm.stakeholder.address.postalCode &&
    (sanitizedForm.stakeholder.address.postalCode.length < 2 ||
      sanitizedForm.stakeholder.address.postalCode.length > STAKEHOLDER_POSTAL_CODE_MAX_LENGTH)
  ) {
    setError(
      "stakeholder.address.postalCode",
      "Stakeholder postal code must be 2 to 10 characters.",
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
