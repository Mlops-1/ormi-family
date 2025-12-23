import happyDogRiv from '@/assets/lotties/happy-dog.riv';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

export default function DogRiveAnimation() {
  const { rive, RiveComponent } = useRive({
    src: happyDogRiv,
    autoplay: true,
    // We assume a state machine exists. Common default is "State Machine 1".
    // If "happy-dog.riv" is different, we'll see in logs.
    stateMachines: 'State Machine 1',
  });

  // Attempt to find standard inputs.
  // If 'happy-dog.riv' uses different names, these will be null.
  // We'll log to console to help debugging.
  const xAxisInput = useStateMachineInput(rive, 'State Machine 1', 'xAxis');
  const yAxisInput = useStateMachineInput(rive, 'State Machine 1', 'yAxis');

  useEffect(() => {
    if (!rive) return;

    // Debug: Log info to find correct State Machine name and Inputs
    // console.log("Rive Loaded. State Machines:", rive.stateMachineNames);
    // if (rive.stateMachineNames.length > 0) {
    //   console.log("Inputs for first SM:", rive.stateMachineInputs(rive.stateMachineNames[0]));
    // }

    const handleMouseMove = (e: MouseEvent) => {
      if (!xAxisInput || !yAxisInput) return;

      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 100;
      const y = (e.clientY / innerHeight) * 100;

      xAxisInput.value = x;
      yAxisInput.value = y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rive, xAxisInput, yAxisInput]);

  return (
    <div className="w-full h-full relative">
      <RiveComponent className="w-full h-full" />
    </div>
  );
}
