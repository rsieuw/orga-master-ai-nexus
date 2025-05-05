import React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  className = "",
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        className="pr-9 rounded-lg h-8"
        placeholder={placeholder}
        type="search"
        onChange={handleChange}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
        <Search size={16} strokeWidth={2} />
      </div>
    </div>
  );
};

export default SearchInput; 