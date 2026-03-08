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
            <SelectTrigger className="w-full h-10 rounded-full bg-[var(--surface-0)]/50 border-[var(--border-subtle)]/50 px-3 text-[11px] font-bold">
                <div className="flex items-center gap-2">
                    <Globe size={14} className="text-[var(--text-muted)]" />
                    <SelectValue placeholder="Language" />
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
