export type ServiceType = 'hospital' | 'police' | 'fire' | 'rab' | 'army' | 'pouroshova';

export const SERVICE_TYPES: { value: ServiceType; label: string; labelBn: string; color: string; emoji: string }[] = [
  { value: 'hospital',   label: 'Hospital',     labelBn: 'হাসপাতাল',   color: 'type-hospital',   emoji: '🏥' },
  { value: 'police',     label: 'Police',       labelBn: 'পুলিশ',       color: 'type-police',     emoji: '👮' },
  { value: 'fire',       label: 'Fire Service', labelBn: 'ফায়ার সার্ভিস', color: 'type-fire',       emoji: '🚒' },
  { value: 'rab',        label: 'RAB',          labelBn: 'র‍্যাব',        color: 'type-rab',        emoji: '🛡️' },
  { value: 'army',       label: 'Army',         labelBn: 'সেনাবাহিনী',   color: 'type-army',       emoji: '🎖️' },
  { value: 'pouroshova', label: 'Pouroshova',   labelBn: 'পৌরসভা',      color: 'type-pouroshova', emoji: '🏛️' },
];

export const EMERGENCY_NUMBERS = [
  { name: 'National Emergency', nameBn: 'জাতীয় জরুরি সেবা', number: '999' },
  { name: 'Fire Service',       nameBn: 'ফায়ার সার্ভিস',       number: '16163' },
  { name: 'Health Helpline',    nameBn: 'স্বাস্থ্য বাতায়ন',     number: '16263' },
  { name: 'Anti-terrorism',     nameBn: 'এন্টি টেররিজম',     number: '01320001100' },
];

export function getTypeMeta(t: ServiceType) {
  return SERVICE_TYPES.find(s => s.value === t) ?? SERVICE_TYPES[0];
}
