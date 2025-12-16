import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface ImageUploadProps {
    value?: File | string;
    onChange: (file: File | null) => void;
    preview?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, preview }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        typeof value === 'string' ? value : preview || null
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        onChange(null);
        setPreviewUrl(null);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Image
            </label>

            {previewUrl ? (
                <div className="relative group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                    />
                    <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#d6b161] transition-colors bg-gray-50 dark:bg-[#112240]"
                    >
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload image
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                            PNG, JPG up to 5MB
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
