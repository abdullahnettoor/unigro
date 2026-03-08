import { useEffect, useState } from "react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import "react-phone-number-input/style.css";
interface PhoneInputFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    defaultCountry?: any;
    error?: boolean;
}

export function PhoneInputField({
    value,
    onChange,
    placeholder = "+91 1234567890",
    className,
    defaultCountry = "IN",
    error
}: PhoneInputFieldProps) {
    const [currentCountry, setCurrentCountry] = useState<any>(defaultCountry);

    // Initial prefill if value is empty
    useEffect(() => {
        if (!value && defaultCountry) {
            const callingCode = getCountryCallingCode(defaultCountry);
            onChange(`+${callingCode}`);
        }
    }, []);

    const handleCountryChange = (newCountry: any) => {
        if (newCountry !== currentCountry) {
            setCurrentCountry(newCountry);
            if (newCountry) {
                const callingCode = getCountryCallingCode(newCountry);
                onChange(`+${callingCode}`);
            }
        }
    };

    return (
        <div className={cn(
            "w-full bg-[var(--surface-deep)]/60 border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[var(--accent-vivid)]",
            error ? "border-[var(--danger)]" : "border-[var(--border-subtle)]",
            className
        )}>
            <PhoneInput
                addInternationalOption={false}
                defaultCountry={defaultCountry}
                value={value}
                onCountryChange={handleCountryChange}
                onChange={(v) => onChange(v || "")}
                placeholder={placeholder}
                className="phone-input-custom"
                smartCaret={false}
            />
            <style>{`
                .phone-input-custom {
                    display: flex;
                    align-items: center;
                    padding: 0.875rem 1rem;
                    width: 100%;
                }
                .phone-input-custom .PhoneInputCountry {
                    margin-right: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .phone-input-custom .PhoneInputInput {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--text-primary);
                    font-family: var(--font-mono);
                    font-size: 1rem;
                    line-height: 1;
                    width: 100%;
                    padding: 0;
                }
                .phone-input-custom .PhoneInputCountrySelectArrow {
                    color: var(--text-muted);
                    opacity: 0.7;
                    width: 0.6rem;
                    height: 0.6rem;
                }
                .phone-input-custom .PhoneInputCountryIcon {
                    width: 1.5rem;
                    height: 1rem;
                    box-shadow: 0 0 1px rgba(0,0,0,0.5);
                    border-radius: 2px;
                }

                /* Hide the default globe/phone icon if it somehow still appears */
                .PhoneInputCountryIcon--world, 
                .PhoneInputCountryIcon--phone {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
