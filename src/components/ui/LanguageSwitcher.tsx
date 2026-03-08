import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const languages = [
        { code: "en", label: "English" },
        { code: "ml", label: "മലയാളം (Malayalam)" }
    ];

    // Some browsers return locales like 'en-US', we just want the 'en' part
    const currentLang = i18n.language?.split('-')[0] || 'en';

    return (
        <Select
            value={currentLang}
            onValueChange={(lang) => {
                i18n.changeLanguage(lang);
            }}
        >
            <SelectTrigger className="w-full bg-[var(--surface-card)]">
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[var(--text-muted)]" />
                    <SelectValue placeholder="Select Language" />
                </div>
            </SelectTrigger>
            <SelectContent>
                {languages.map((lng) => (
                    <SelectItem key={lng.code} value={lng.code}>
                        {lng.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
