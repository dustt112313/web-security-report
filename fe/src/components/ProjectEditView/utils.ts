import { Shield, AlertTriangle, AlertOctagon, XCircle } from "lucide-react";
import { Vulnerability } from "./types";

// Helper function to get severity styling
export const getSeverityStyle = (severity: Vulnerability['severity']) => {
  const styles = {
    'Thấp': {
      icon: 'Shield',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      dot: 'bg-emerald-500'
    },
    'Trung Bình': {
      icon: 'AlertTriangle',
      iconColor: 'text-amber-600', 
      badge: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      dot: 'bg-amber-500'
    },
    'Cao': {
      icon: 'AlertOctagon',
      iconColor: 'text-orange-600',
      badge: 'bg-orange-50 text-orange-700 border border-orange-200/60',
      dot: 'bg-orange-500'
    },
    'Nghiêm Trọng': {
      icon: 'XCircle',
      iconColor: 'text-red-600',
      badge: 'bg-red-50 text-red-700 border border-red-200/60',
      dot: 'bg-red-500'
    }
  };
  return styles[severity];
};

// Helper function to convert number to Roman numerals
export const toRoman = (num: number): string => {
  const romanNumerals = [
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' }
  ];
  
  let result = '';
  for (const { value, symbol } of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

// Helper function to get severity icon component
export const getSeverityIcon = (severity: Vulnerability['severity']) => {
  const iconMap = {
    'Thấp': Shield,
    'Trung Bình': AlertTriangle,
    'Cao': AlertOctagon,
    'Nghiêm Trọng': XCircle
  };
  return iconMap[severity];
};