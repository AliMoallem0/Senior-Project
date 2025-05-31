export interface PhoneFormat {
  pattern: RegExp;
  example: string;
  description: string;
}

export const phoneFormats: Record<string, PhoneFormat> = {
  'LB': {
    pattern: /^(\d{7}|\d{8})$/,
    example: '70123456',
    description: '7 or 8 digits (e.g., 70123456)'
  },
  'US': {
    pattern: /^\d{10}$/,
    example: '2015550123',
    description: '10 digits (e.g., 2015550123)'
  },
  'GB': {
    pattern: /^\d{10}$/,
    example: '7911123456',
    description: '10 digits (e.g., 7911123456)'
  },
  'FR': {
    pattern: /^\d{9}$/,
    example: '612345678',
    description: '9 digits (e.g., 612345678)'
  },
  'DE': {
    pattern: /^\d{10,11}$/,
    example: '15123456789',
    description: '10 or 11 digits (e.g., 15123456789)'
  },
  'IT': {
    pattern: /^\d{9,10}$/,
    example: '3123456789',
    description: '9 or 10 digits (e.g., 3123456789)'
  },
  'ES': {
    pattern: /^\d{9}$/,
    example: '612345678',
    description: '9 digits (e.g., 612345678)'
  },
  'AE': {
    pattern: /^\d{9}$/,
    example: '501234567',
    description: '9 digits (e.g., 501234567)'
  },
  'SA': {
    pattern: /^\d{9}$/,
    example: '501234567',
    description: '9 digits (e.g., 501234567)'
  },
  'EG': {
    pattern: /^\d{10}$/,
    example: '1012345678',
    description: '10 digits (e.g., 1012345678)'
  },
  // Add more countries as needed
}; 