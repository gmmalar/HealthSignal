import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const states = [
  { value: "texas", label: "Texas" },
  { value: "california", label: "California" },
  { value: "florida", label: "Florida" },
];

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function StateSelector({ value, onChange }: StateSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="state-select" className="text-sm font-medium">
        State
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="state-select" className="w-full">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {states.map((state) => (
            <SelectItem key={state.value} value={state.value}>
              {state.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
