import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const topics = [
  { value: "disease-outbreaks", label: "Disease Outbreaks" },
  { value: "air-quality", label: "Air Quality" },
  { value: "flu", label: "Flu" },
];

interface TopicSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TopicSelector({ value, onChange }: TopicSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="topic-select" className="text-sm font-medium">
        Health Topic
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="topic-select" className="w-full">
          <SelectValue placeholder="Select Topic" />
        </SelectTrigger>
        <SelectContent>
          {topics.map((topic) => (
            <SelectItem key={topic.value} value={topic.value}>
              {topic.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
