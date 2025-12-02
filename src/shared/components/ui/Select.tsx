/**
 * Select 컴포넌트
 *
 * 커스텀 드롭다운 셀렉트 박스 컴포넌트
 * - 완전한 스타일 커스터마이징
 * - 키보드 접근성 지원
 */

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  error,
  size = 'md',
  placeholder = '선택하세요',
  disabled = false,
  className,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange?.({ target: { value: selectedValue } });
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* 트리거 버튼 */}
        <button
          type="button"
          id={selectId}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center justify-between border rounded-lg transition-colors bg-white text-left',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            sizeClasses[size],
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300',
            isOpen && 'ring-2 ring-blue-500 border-blue-500'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={clsx(
            'truncate',
            selectedOption ? 'text-gray-900' : 'text-gray-400'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            size={18}
            className={clsx(
              'text-gray-400 transition-transform ml-2 flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <ul
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={clsx(
                  'px-3 py-2 cursor-pointer flex items-center justify-between',
                  'transition-colors text-sm',
                  value === option.value
                    ? 'bg-blue-50 text-blue-700'
                    : highlightedIndex === index
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check size={16} className="text-blue-600 flex-shrink-0" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

Select.displayName = 'Select';
