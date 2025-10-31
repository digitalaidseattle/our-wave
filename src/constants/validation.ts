  // Basic validation rules stored in one place
export const VALIDATION = {
    MIN_LEN: 1,
    RATING_MIN: 0,
    RATING_MAX: 5,
  } as const;
  
  // Reusable error messages for form fields
  export const MSG = {
    required: (label: string) => `${label} is required`,
    ratingRange: (min: number, max: number) => `Rating must be between ${min} and ${max}`,
  };
  