import { formatUnits } from 'viem';

export function shortenAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatUsdc(amount: bigint | number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0.00';
  
  let amtBig: bigint;
  if (typeof amount === 'bigint') {
    amtBig = amount;
  } else if (typeof amount === 'number') {
    amtBig = BigInt(Math.floor(amount));
  } else {
    amtBig = BigInt(Math.floor(Number(amount)));
  }

  const formatted = formatUnits(amtBig, 6);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(formatted));
}
