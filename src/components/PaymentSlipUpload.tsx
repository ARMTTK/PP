import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, FileText, Image } from 'lucide-react';

interface PaymentSlipUploadProps {
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  uploadedFile?: {
    name: string;
    url: string;
    status: 'pending' | 'verified' | 'rejected';
    verificationNotes?: string;
  };
  isUploading?: boolean;
  className?: string;
}

export const PaymentSlipUpload: React.FC<PaymentSlipUploadProps> = ({
  onUpload,
  onRemove,
  uploadedFile,
  isUploading = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only JPG, PNG, or PDF files');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    onUpload(file);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (uploadedFile) {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {uploadedFile.name.toLowerCase().includes('.pdf') ? (
              <FileText className="h-8 w-8 text-red-600" />
            ) : (
              <Image className="h-8 w-8 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.name}
              </p>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(uploadedFile.status)}`}>
              {getStatusIcon(uploadedFile.status)}
              <span className="capitalize">{uploadedFile.status}</span>
            </div>
            
            {uploadedFile.verificationNotes && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>Note:</strong> {uploadedFile.verificationNotes}
              </p>
            )}
            
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View uploaded file
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleChange}
        className="hidden"
      />
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Upload Payment Slip
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Upload a clear photo or PDF of your payment receipt
              </p>
              <button
                onClick={onButtonClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-2">
                or drag and drop your file here
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: JPG, PNG, PDF (max 5MB)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};