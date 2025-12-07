import { motion } from 'framer-motion';

interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function RadioGroup({ options, value, onChange, label }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-gray-700 font-bold mb-1 ml-1">{label}</label>
      )}
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            value === option.id
              ? 'border-ormi-green-500 bg-ormi-green-50'
              : 'border-gray-200 hover:border-ormi-green-200 bg-white'
          }`}
        >
          <input
            type="radio"
            className="hidden"
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              value === option.id ? 'border-ormi-green-500' : 'border-gray-300'
            }`}
          >
            {value === option.id && (
              <motion.div
                layoutId="radio-indicator"
                className="w-2.5 h-2.5 rounded-full bg-ormi-green-500"
              />
            )}
          </div>
          <span
            className={`font-medium text-base ${value === option.id ? 'text-ormi-green-800' : 'text-gray-600'}`}
          >
            {option.label}
          </span>
          {value === option.id && (
            <motion.div
              layoutId="radio-highlight"
              className="absolute inset-0 border-2 border-ormi-green-500 rounded-xl pointer-events-none"
            />
          )}
        </label>
      ))}
    </div>
  );
}
