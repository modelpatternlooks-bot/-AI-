import React from 'react';

interface SelectorProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  id: string;
}

const Selector = <T extends string,>({ label, value, options, onChange, id }: SelectorProps<T>) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full pl-3 pr-10 py-2.5 text-base transition-all duration-300 rounded-lg shadow-sm appearance-none
                     bg-gray-500/10 dark:bg-gray-900/30
                     border border-gray-300/50 dark:border-gray-700/50
                     text-gray-800 dark:text-white
                     placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-indigo-400/0
                     focus:bg-gray-500/20 dark:focus:bg-gray-900/40"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default Selector;