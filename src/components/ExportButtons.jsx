import React from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ExportButtons Component
 * CSV ve PDF export butonları
 */

const ExportButtons = ({
  onCSVExport,
  onPDFExport,
  csvDisabled = false,
  pdfDisabled = false,
  csvLabel = 'Export CSV',
  pdfLabel = 'Export PDF',
  size = 'medium',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    small: {
      button: 'px-3 py-1.5 text-xs',
      icon: 14
    },
    medium: {
      button: 'px-4 py-2 text-sm',
      icon: 16
    },
    large: {
      button: 'px-6 py-3 text-base',
      icon: 18
    }
  };

  const variantClasses = {
    default: {
      csv: 'bg-green-600 hover:bg-green-700 text-white',
      pdf: 'bg-red-600 hover:bg-red-700 text-white'
    },
    outline: {
      csv: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
      pdf: 'border-2 border-red-600 text-red-600 hover:bg-red-50'
    },
    ghost: {
      csv: 'text-green-600 hover:bg-green-50',
      pdf: 'text-red-600 hover:bg-red-50'
    }
  };

  const sizes = sizeClasses[size];
  const variants = variantClasses[variant];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        onClick={onCSVExport}
        disabled={csvDisabled}
        whileHover={{ scale: csvDisabled ? 1 : 1.02 }}
        whileTap={{ scale: csvDisabled ? 1 : 0.98 }}
        className={`
          flex items-center gap-2 rounded-lg font-medium
          transition-colors duration-200
          ${sizes.button}
          ${variants.csv}
          ${csvDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <FileSpreadsheet size={sizes.icon} />
        <span>{csvLabel}</span>
      </motion.button>

      <motion.button
        onClick={onPDFExport}
        disabled={pdfDisabled}
        whileHover={{ scale: pdfDisabled ? 1 : 1.02 }}
        whileTap={{ scale: pdfDisabled ? 1 : 0.98 }}
        className={`
          flex items-center gap-2 rounded-lg font-medium
          transition-colors duration-200
          ${sizes.button}
          ${variants.pdf}
          ${pdfDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <FileText size={sizes.icon} />
        <span>{pdfLabel}</span>
      </motion.button>
    </div>
  );
};

/**
 * Sadece CSV export butonu
 */
export const CSVExportButton = ({
  onClick,
  disabled = false,
  label = 'Export CSV',
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        flex items-center gap-2 rounded-lg font-medium
        bg-green-600 hover:bg-green-700 text-white
        transition-colors duration-200
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <Download size={iconSizes[size]} />
      <span>{label}</span>
    </motion.button>
  );
};

/**
 * Sadece PDF export butonu
 */
export const PDFExportButton = ({
  onClick,
  disabled = false,
  label = 'Export PDF',
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        flex items-center gap-2 rounded-lg font-medium
        bg-red-600 hover:bg-red-700 text-white
        transition-colors duration-200
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <Download size={iconSizes[size]} />
      <span>{label}</span>
    </motion.button>
  );
};

/**
 * Dropdown export menüsü
 */
export const ExportDropdown = ({
  onCSVExport,
  onPDFExport,
  disabled = false,
  label = 'Export',
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          bg-gray-800 hover:bg-gray-700 text-white
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Download size={16} />
        <span>{label}</span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
        >
          <button
            onClick={() => {
              onCSVExport?.();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-gray-700 transition-colors"
          >
            <FileSpreadsheet size={18} className="text-green-600" />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={() => {
              onPDFExport?.();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-gray-700 transition-colors border-t border-gray-100"
          >
            <FileText size={18} className="text-red-600" />
            <span>Export as PDF</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ExportButtons;
