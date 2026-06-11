export interface ICurrency {
  code: string;
  name: string;
  namePlural: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  rounding: number;
  countries: string[];
}
