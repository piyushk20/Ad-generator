import React from 'react';

interface ProgressStepperProps {
  currentStage: number;
}

const STAGES = [
  { id: 1, name: 'Setup' },
  { id: 2, name: 'Ideation' },
  { id: 3, name: 'Refinement' },
  { id: 4, name: 'Final Output' },
];

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStage }) => {
    const progressPercentage = ((currentStage - 1) / (STAGES.length - 1)) * 100;

    return (
        <div className="w-full px-4 sm:px-0">
            <div className="relative">
                <div className="stepper-track"></div>
                <div className="stepper-progress" style={{ width: `${progressPercentage}%` }}></div>
                <div className="flex justify-between items-center relative z-10">
                    {STAGES.map((stage) => {
                        const isCompleted = currentStage > stage.id;
                        const isActive = currentStage === stage.id;

                        return (
                            <div key={stage.id} className="text-center">
                                <div
                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 mx-auto
                                    ${isCompleted ? 'bg-blue-500' : ''}
                                    ${isActive ? 'bg-blue-500 ring-4 ring-blue-500/50' : ''}
                                    ${!isCompleted && !isActive ? 'bg-gray-600' : ''}`}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    ) : (
                                        <span className="font-bold text-white text-sm">{stage.id}</span>
                                    )}
                                </div>
                                <p
                                    className={`mt-2 text-xs md:text-sm font-semibold transition-colors duration-300
                                    ${isActive ? 'text-blue-400' : 'text-gray-400'}
                                    ${isCompleted ? 'text-gray-200' : ''}`}
                                >
                                    {stage.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProgressStepper;
