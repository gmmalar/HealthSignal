import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getStatesForTopic } from "@/services/stateConfig";

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  topic: string;
}

export function StateSelector({ value, onChange, topic }: StateSelectorProps) {
  const states = getStatesForTopic(topic);
  const disabled = !topic || states.length === 0;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="state-select" className="text-sm font-medium">
        State
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="state-select" className="w-full">
          <SelectValue placeholder={topic ? "Select State" : "Select a topic first"} />
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
