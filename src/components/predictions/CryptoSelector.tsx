import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CRYPTO_OPTIONS = [
  { value: "bitcoin", label: "Bitcoin (BTC)" },
  { value: "ethereum", label: "Ethereum (ETH)" },
  { value: "solana", label: "Solana (SOL)" },
  { value: "binancecoin", label: "BNB" },
  { value: "cardano", label: "Cardano (ADA)" },
  { value: "ripple", label: "XRP" },
  { value: "polkadot", label: "Polkadot (DOT)" },
  { value: "dogecoin", label: "Dogecoin (DOGE)" },
  { value: "avalanche-2", label: "Avalanche (AVAX)" },
  { value: "chainlink", label: "Chainlink (LINK)" },
];

interface CryptoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CryptoSelector({ value, onChange }: CryptoSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-card/50 border-border/50">
        <SelectValue placeholder="Select crypto" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border/50">
        {CRYPTO_OPTIONS.map((crypto) => (
          <SelectItem key={crypto.value} value={crypto.value}>
            {crypto.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
