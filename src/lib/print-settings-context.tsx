import { createContext, useContext, useState, ReactNode } from "react";

export interface PrintSettings {
    thermalWidth: string;
    thermalHeight: string;
    thermalMargin: string;
    thermalFontSize: string;
    a4Margin: string;
    a4FontSize: string;
    defaultPaperSize: "A4" | "thermal";
}

interface PrintSettingsContextType {
    settings: PrintSettings;
    setSettings: (settings: PrintSettings) => void;
}

const PrintSettingsContext = createContext<PrintSettingsContextType | undefined>(undefined);

export function PrintSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<PrintSettings>({
        thermalWidth: "80",
        thermalHeight: "200",
        thermalMargin: "5",
        thermalFontSize: "11",
        a4Margin: "10",
        a4FontSize: "14",
        defaultPaperSize: "A4",
    });

    return (
        <PrintSettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </PrintSettingsContext.Provider>
    );
}

export function usePrintSettings() {
    const context = useContext(PrintSettingsContext);
    if (context === undefined) {
        throw new Error("usePrintSettings must be used within a PrintSettingsProvider");
    }
    return context;
}
