import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";

// Settings page — partially rebuilt (language switcher retained)
export function Settings() {
    const { t } = useTranslation();

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
            <div>
                <h1 className="text-2xl font-display font-bold">Settings</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Manage your preferences and account details.
                </p>
            </div>

            {/* Language */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold">{t("domain.pool", "Language")}</h2>
                <LanguageSwitcher />
            </section>

            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] p-8">
                <span className="text-4xl">⚙️</span>
                <p className="text-sm text-[var(--text-muted)]">More settings coming in the UI revamp.</p>
            </div>
        </div>
    );
}
