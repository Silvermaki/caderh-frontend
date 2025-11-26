"use client";
import React, { useState } from 'react';

export interface IGlobalContextProps {
    unit: 'imperial' | 'metric';
    setUnit: (unit: 'imperial' | 'metric') => void;
}

export const GlobalContext = React.createContext<IGlobalContextProps>({
    unit: 'imperial',
    setUnit: () => { },
});

export const GlobalContextProvider = (props: any) => {
    const [currentUnit, setCurrentUnit] = useState<'imperial' | 'metric'>('imperial');

    return (
        <GlobalContext.Provider
            value={{
                unit: currentUnit,
                setUnit: setCurrentUnit
            }}
        >
            {props.children}
        </GlobalContext.Provider>
    );
};