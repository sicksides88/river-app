import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  SIMULATION_STEP_MS,
  SIMULATION_STEPS,
  buildSimulatedAuxilio,
  getMockDriverLocation,
  getSimulationStepLabel,
  isSimulationComplete,
} from '../utils/auxilioSimulator';

export const useAuxilioSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [baseAuxilio, setBaseAuxilio] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopSimulation = useCallback(() => {
    clearTimer();
    setIsSimulating(false);
    setStepIndex(0);
    setBaseAuxilio(null);
  }, [clearTimer]);

  const startSimulation = useCallback(
    (auxilio) => {
      if (!auxilio || !__DEV__) return;

      clearTimer();
      setBaseAuxilio(auxilio);
      setStepIndex(0);
      setIsSimulating(true);

      timerRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= SIMULATION_STEPS.length - 1) {
            clearTimer();
            return prev;
          }
          return prev + 1;
        });
      }, SIMULATION_STEP_MS);
    },
    [clearTimer]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const simulatedAuxilio = useMemo(() => {
    if (!isSimulating || !baseAuxilio) return null;
    return buildSimulatedAuxilio(baseAuxilio, stepIndex);
  }, [isSimulating, baseAuxilio, stepIndex]);

  const mockDriverLocation = useMemo(() => {
    if (!isSimulating || !baseAuxilio) return null;
    return getMockDriverLocation(baseAuxilio.pickup, stepIndex);
  }, [isSimulating, baseAuxilio, stepIndex]);

  const stepLabel = useMemo(
    () => (isSimulating ? getSimulationStepLabel(stepIndex) : ''),
    [isSimulating, stepIndex]
  );

  const isComplete = isSimulating && isSimulationComplete(stepIndex);

  return {
    isSimulating,
    stepIndex,
    stepLabel,
    isComplete,
    simulatedAuxilio,
    mockDriverLocation,
    startSimulation,
    stopSimulation,
  };
};

export default useAuxilioSimulator;
