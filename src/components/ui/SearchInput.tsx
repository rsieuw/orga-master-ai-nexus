import React, { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

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
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className} rounded-full`}>
      <Input
        id="searchInput"
        className="pl-4 pr-20 rounded-full h-10 border border-white/10"
        placeholder={placeholder}
        type="search"
        value={inputValue}
        onChange={handleChange}
      />
      {inputValue && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute inset-y-0 right-9 h-full w-9 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          type="button"
        >
          <X size={16} />
        </Button>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
        <Search size={16} strokeWidth={2} />
      </div>
    </div>
  );
};

export default SearchInput; 