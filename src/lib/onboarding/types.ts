export interface OnboardingState {
    // Step 1 — Google connect
    googleConnected: boolean;
    googleAccountId?: string;
    selectedLocationName?: string; // GMB location resource name
    selectedLocationDisplay?: string; // human-readable name

    // Step 2 — Brand setup
    businessName?: string;
    businessType?: string;
    logoUrl?: string;
    primaryColor?: string;   // hex e.g. '#7C3AED'
    secondaryColor?: string; // hex

    // Step 3 — Template
    selectedTemplate?: 'classic' | 'bold' | 'product';

    // Step 4 — Activation
    autoPostEnabled?: boolean;
    postFrequency?: number; // posts per week
    completedAt?: string;   // ISO date string

    // Meta
    currentStep: number;    // 1–4
    businessId?: string;    // set after Step 2 saves to DB
}

/** Payload accepted by POST /api/onboarding */
export interface OnboardingPayload {
    step: number;
    data: Partial<OnboardingState>;
    businessId?: string;
}

/** Response from POST /api/onboarding */
export interface OnboardingResponse {
    success: boolean;
    businessId?: string;
    nextStep?: number;
    error?: string;
}
