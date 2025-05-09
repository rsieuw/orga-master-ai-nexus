import React, { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { X } from "lucide-react";
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
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iconStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#6B21A8" />
            </linearGradient>
          </defs>
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7V7A2.5 2.5 0 0 0 7 9.5v0A2.5 2.5 0 0 0 9.5 12V12A2.5 2.5 0 0 1 12 14.5v0A2.5 2.5 0 0 1 9.5 17h-3A2.5 2.5 0 0 1 4 14.5v0A2.5 2.5 0 0 1 6.5 12V12A2.5 2.5 0 0 0 4 9.5v0A2.5 2.5 0 0 0 6.5 7h3A2.5 2.5 0 0 0 12 4.5V4.5A2.5 2.5 0 0 1 9.5 2Z" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v0A2.5 2.5 0 0 0 14.5 7V7A2.5 2.5 0 0 1 17 9.5v0A2.5 2.5 0 0 1 14.5 12V12A2.5 2.5 0 0 0 12 14.5v0A2.5 2.5 0 0 0 14.5 17h3A2.5 2.5 0 0 0 20 14.5v0A2.5 2.5 0 0 0 17.5 12V12A2.5 2.5 0 0 1 20 9.5v0A2.5 2.5 0 0 1 17.5 7h-3A2.5 2.5 0 0 1 12 4.5V4.5A2.5 2.5 0 0 0 14.5 2Z" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15a2.5 2.5 0 0 0 2.5 2.5v0A2.5 2.5 0 0 0 12 20v0A2.5 2.5 0 0 0 9.5 22.5v0A2.5 2.5 0 0 0 12 20Z" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14.5A2.5 2.5 0 0 0 9.5 12v0A2.5 2.5 0 0 0 7 9.5" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14.5A2.5 2.5 0 0 1 14.5 12v0A2.5 2.5 0 0 1 17 9.5" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 9.5A2.5 2.5 0 0 1 14.5 7V7A2.5 2.5 0 0 0 12 4.5" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 9.5A2.5 2.5 0 0 0 9.5 7V7A2.5 2.5 0 0 1 12 4.5" stroke="url(#iconStrokeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export default SearchInput; 