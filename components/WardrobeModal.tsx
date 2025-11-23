
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WardrobeItem, SavedLook } from '../types';
import { UploadCloudIcon, CheckCircleIcon, BookmarkIcon, Trash2Icon, PlusIcon, XIcon, SaveIcon, PaletteIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem, color?: string) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  savedLooks: SavedLook[];
  onSaveLook: (name: string) => void;
  onDeleteLook: (id: string) => void;
  onSelectLook: (look: SavedLook) => void;
  displayImageUrl: string | null;
}

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const COLORS = [
    { name: 'Original', hex: 'transparent' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Brown', hex: '#78350F' },
];

const WardrobePanel: React.FC<WardrobePanelProps> = ({ 
    onGarmentSelect, 
    activeGarmentIds, 
    isLoading, 
    wardrobe,
    savedLooks,
    onSaveLook,
    onDeleteLook,
    onSelectLook,
    displayImageUrl
}) => {
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'garments' | 'looks'>('garments');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newLookName, setNewLookName] = useState('');
    const [selectedGarmentForColor, setSelectedGarmentForColor] = useState<WardrobeItem | null>(null);
    const [selectedColor, setSelectedColor] = useState('Original');
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        
        try {
            const file = await urlToFile(item.url, item.name);
            // Open Color Modal instead of immediately applying
            setPendingFile(file);
            setSelectedGarmentForColor(item);
            setSelectedColor('Original');
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}.`, err);
        }
    };

    const handleApplyGarment = () => {
        if (pendingFile && selectedGarmentForColor) {
            onGarmentSelect(pendingFile, selectedGarmentForColor, selectedColor);
            setPendingFile(null);
            setSelectedGarmentForColor(null);
            setSelectedColor('Original');
        }
    };

    const handleCancelColorSelection = () => {
        setPendingFile(null);
        setSelectedGarmentForColor(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
            };
            
            // For custom uploads, we can also offer color selection
            setPendingFile(file);
            setSelectedGarmentForColor(customGarmentInfo);
            setSelectedColor('Original');
        }
    };

    const handleSaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLookName.trim()) {
            onSaveLook(newLookName.trim());
            setNewLookName('');
            setIsSaveModalOpen(false);
            setActiveTab('looks'); // Switch to looks tab to show the new save
        }
    };

    return (
    <div className="pt-6 border-t border-gray-400/50 flex flex-col h-full relative">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif tracking-wider text-gray-800">Wardrobe</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('garments')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'garments' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Garments
                </button>
                <button
                    onClick={() => setActiveTab('looks')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        activeTab === 'looks' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <BookmarkIcon className="w-3 h-3" />
                    Looks
                </button>
            </div>
        </div>

        {activeTab === 'garments' ? (
            <div className="grid grid-cols-3 gap-3">
                {wardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                return (
                    <button
                    key={item.id}
                    onClick={() => handleGarmentClick(item)}
                    disabled={isLoading || isActive}
                    className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={`Select ${item.name}`}
                    >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                    </div>
                    {isActive && (
                        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                            <CheckCircleIcon className="w-8 h-8 text-white" />
                        </div>
                    )}
                    </button>
                );
                })}
                <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer'}`}>
                    <UploadCloudIcon className="w-6 h-6 mb-1"/>
                    <span className="text-xs text-center">Upload</span>
                    <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
                </label>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setIsSaveModalOpen(true)}
                    disabled={isLoading || !displayImageUrl}
                    className="aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-white"
                >
                    <SaveIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Save Current Look</span>
                </button>
                {savedLooks.map((look) => (
                    <div key={look.id} className="relative aspect-[3/4] border rounded-lg overflow-hidden group">
                        <img src={look.url} alt={look.name} className="w-full h-full object-cover" />
                         {look.garmentColors && look.garmentColors.length > 0 && (
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                {look.garmentColors.map((color, idx) => (
                                    <div 
                                        key={idx} 
                                        className="w-3 h-3 rounded-full border border-white shadow-sm" 
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-bold truncate">{look.name}</p>
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => onSelectLook(look)}
                                    className="flex-1 bg-white text-gray-900 text-xs py-1 rounded hover:bg-gray-200"
                                >
                                    Wear
                                </button>
                                <button 
                                    onClick={() => onDeleteLook(look.id)}
                                    className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                                >
                                    <Trash2Icon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'garments' && wardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">Your uploaded garments will appear here.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {/* Save Look Modal */}
        <AnimatePresence>
            {isSaveModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                >
                    <motion.div
                         initial={{ scale: 0.95, y: 10 }}
                         animate={{ scale: 1, y: 0 }}
                         exit={{ scale: 0.95, y: 10 }}
                         className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                             <h3 className="font-serif text-lg text-gray-900">Save Look</h3>
                             <button onClick={() => setIsSaveModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                 <XIcon className="w-5 h-5" />
                             </button>
                        </div>
                        <form onSubmit={handleSaveSubmit} className="p-4">
                            <div className="mb-4 flex justify-center bg-gray-100 rounded-lg p-2">
                                {displayImageUrl && (
                                    <img src={displayImageUrl} alt="Preview" className="h-48 object-contain rounded-md" />
                                )}
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Look Name</label>
                            <input
                                type="text"
                                value={newLookName}
                                onChange={(e) => setNewLookName(e.target.value)}
                                placeholder="e.g., Summer Vibes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                autoFocus
                            />
                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSaveModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newLookName.trim()}
                                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Color Selection Modal */}
        <AnimatePresence>
            {selectedGarmentForColor && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 flex flex-col bg-white"
                >
                     <div className="p-4 border-b flex items-center justify-between bg-white">
                        <h3 className="font-serif text-lg text-gray-900">Select Color</h3>
                        <button onClick={handleCancelColorSelection} className="text-gray-500 hover:text-gray-700">
                             <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                <img src={selectedGarmentForColor.url} alt={selectedGarmentForColor.name} className="w-full h-full object-cover" />
                                {selectedColor !== 'Original' && (
                                    <div className="absolute inset-0 mix-blend-multiply opacity-70" style={{ backgroundColor: selectedColor === 'White' ? 'transparent' : selectedColor }} />
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(color.name)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${selectedColor === color.name ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div 
                                        className={`w-8 h-8 rounded-full border border-gray-200 shadow-sm flex items-center justify-center`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {color.name === 'Original' && (
                                            <PaletteIcon className="w-4 h-4 text-gray-500" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">{color.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <button
                            onClick={handleApplyGarment}
                            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Apply {selectedColor !== 'Original' ? selectedColor : ''}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default WardrobePanel;
