import React from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import './ExportButtons.css';

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
  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  const iconSize = iconSizes[size] || 16;

  return (
    <div className={`export-buttons export-buttons--${size} export-buttons--${variant} ${className}`.trim()}>
      <motion.button
        onClick={onCSVExport}
        disabled={csvDisabled}
        whileHover={{ scale: csvDisabled ? 1 : 1.02 }}
        whileTap={{ scale: csvDisabled ? 1 : 0.98 }}
        className={`export-btn export-btn--csv ${csvDisabled ? 'is-disabled' : ''}`.trim()}
      >
        <FileSpreadsheet size={iconSize} />
        <span>{csvLabel}</span>
      </motion.button>

      <motion.button
        onClick={onPDFExport}
        disabled={pdfDisabled}
        whileHover={{ scale: pdfDisabled ? 1 : 1.02 }}
        whileTap={{ scale: pdfDisabled ? 1 : 0.98 }}
        className={`export-btn export-btn--pdf ${pdfDisabled ? 'is-disabled' : ''}`.trim()}
      >
        <FileText size={iconSize} />
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
      className={`export-btn export-btn--csv export-btn--${size} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
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
      className={`export-btn export-btn--pdf export-btn--${size} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
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
    <div ref={dropdownRef} className={`export-dropdown ${className}`.trim()}>
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`export-dropdown-trigger ${disabled ? 'is-disabled' : ''}`.trim()}
      >
        <Download size={16} />
        <span>{label}</span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="export-dropdown-menu"
        >
          <button
            onClick={() => {
              onCSVExport?.();
              setIsOpen(false);
            }}
            className="export-dropdown-item export-dropdown-item--csv"
          >
            <FileSpreadsheet size={18} />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={() => {
              onPDFExport?.();
              setIsOpen(false);
            }}
            className="export-dropdown-item export-dropdown-item--pdf"
          >
            <FileText size={18} />
            <span>Export as PDF</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ExportButtons;
