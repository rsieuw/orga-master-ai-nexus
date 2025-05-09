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
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const clearInput = () => {
    setInputValue('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div
      className={`
        group
        relative
        h-10
        rounded-full
        border border-white/10
        bg-transparent
        transition-all duration-300 ease-in-out
        focus-within:border-primary
        ${isFocused ? 'w-72' : 'w-52'}
        ${className}
      `}
    >
      <Input
        id="searchInput"
        className="w-full h-full rounded-full bg-transparent border-none pl-4 pr-10 text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={placeholder}
        type="search"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-8 h-full w-9 text-muted-foreground hover:text-foreground"
          onClick={clearInput}
          type="button"
        >
          <X size={16} />
        </Button>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
      </div>
    </div>
  );
};

export default SearchInput; 