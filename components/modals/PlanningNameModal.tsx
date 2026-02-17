'use client';

import { PlanningNameModalProps } from '@/types';

export default function PlanningNameModal({ 
  isOpen, 
  onClose, 
  planningName, 
  setPlanningName, 
  selectedHours, 
  handleHourChange, 
  onConfirm 
}: PlanningNameModalProps) {
  if (!isOpen) return null;

  const hours: string[] = [
    '8h', '9h', '10h', '11h', '12h',
    '13h','14h', '15h',
    '16h','17h', '18h',
    '19h', '20h'
  ];

  return (
    <div className="fixed inset-0 z-1000 flex items-start justify-center bg-black/10 backdrop-blur-sm bg-opacity-50">
      <div className="bg-white my-[5%] mx-auto p-6 rounded-xl w-[90%] max-w-200 max-h-[80vh]">
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
              className="w-full p-2.5 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
              placeholder="Entrez le nom du planning"
              value={planningName}
              onChange={(e) => setPlanningName(e.target.value)}
            />
          </div>
          
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">
              Sélectionnez les horaires :
            </label>
            <div className="flex flex-wrap gap-7.5 mt-2.5 max-h-50 ">
              {hours.map((hour, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-gray-200"
                >
                  <input 
                    type="checkbox" 
                    id={`hour-${index}`} 
                    value={hour}
                    checked={selectedHours.includes(hour)}
                    onChange={() => handleHourChange(hour)}
                    className="mr-1.5 cursor-pointer"
                  />
                  <label 
                    htmlFor={`hour-${index}`} 
                    className={`cursor-pointer ${selectedHours.includes(hour) ? 'font-semibold text-primary' : ''}`}
                  >
                    {hour}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2.5 mt-5">
            <button 
              className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Annuler
            </button>
            <button 
              className="px-4 py-2 border-none rounded-md text-sm cursor-pointer transition-all bg-blue-500 text-white hover:bg-blue-500/90"
              onClick={onConfirm}
            >
              Creer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}