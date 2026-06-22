import React from "react";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchBar = ({ onSearch, className = "", ...props }: SearchBarProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <i className="fa-solid fa-magnifying-glass text-gray-400 text-xs" />
      </div>
      <input
        type="search"
        className="block w-full rounded-md border-0 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 shadow-xs
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
