'use client';

import { PlanningNameModalProps } from '@/types';
import { useState } from 'react';

export default function PlanningNameModal({ 
  isOpen, 
  onClose, 
  planningName, 
  setPlanningName, 
  selectedHours, 
  handleHourChange, 
  onConfirm 
}: PlanningNameModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleConfirm = async () => {
    setIsCreating(true);
    await onConfirm();
    setIsCreating(false);
  };

  if (!isOpen) return null;

  const hours: string[] = [
    '8h', '9h', '10h', '11h', '12h',
    '13h', '14h', '15h',
    '16h', '17h', '18h',
    '19h', '20h'
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/10 backdrop-blur-sm bg-opacity-50">
      <div className="bg-white my-[5%] mx-auto p-6 rounded-xl w-[90%] max-w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl text-gray-800 m-0">Nouveau Planning</h3>
          <span 
            className="text-2xl font-bold cursor-pointer text-gray-600 hover:text-black"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        
        <div className="py-5">
          <div className="mb-5">
            <label htmlFor="planningName" className="block mb-2 text-gray-700 font-medium">
              Nom du planning :
            </label>
            <input 
              type="text" 
              id="planningName" 
              className="w-full p-2.5 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              placeholder="Entrez le nom du planning"
              value={planningName}
              onChange={(e) => setPlanningName(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">
              Sélectionnez les horaires :
            </label>
            <div className="flex flex-wrap gap-2.5 mt-2.5 max-h-[200px] overflow-y-auto">
              {hours.map((hour, index) => (
                <div 
                  key={index} 
                  className={`flex items-center bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-gray-200 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    id={`hour-${index}`}
                    value={hour}
                    checked={selectedHours.includes(hour)}
                    onChange={() => handleHourChange(hour)}
                    className="mr-1.5 cursor-pointer"
                    disabled={isCreating}
                  />
                  <label 
                    htmlFor={`hour-${index}`}
                    className={`cursor-pointer ${selectedHours.includes(hour) ? 'font-semibold text-blue-600' : ''}`}
                  >
                    {hour}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2.5 mt-5">
            <button 
              className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              onClick={onClose}
              disabled={isCreating}
            >
              Annuler
            </button>
            <button 
              className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              onClick={handleConfirm}
              disabled={isCreating}
            >
              {isCreating && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isCreating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}