import React, { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/**
 * Props for the SearchInput component.
 *
 * @interface SearchInputProps
 */
interface SearchInputProps {
  /** Placeholder text for the input field. */
  placeholder?: string;
  /** Additional CSS class names for the component. */
  className?: string;
  /** Callback function triggered when the input value changes. */
  onChange?: (value: string) => void;
}

/**
 * SearchInput component.
 *
 * A styled input field with a search icon and a clear button.
 * It expands on focus and provides a callback for value changes.
 *
 * @param {SearchInputProps} props - The props for the component.
 * @returns {JSX.Element} The rendered SearchInput component.
 */
const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  className = "",
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Handles the change event of the input field.
   * Updates the internal state and calls the onChange callback.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  /**
   * Clears the input field value.
   * Updates the internal state and calls the onChange callback with an empty string.
   */
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