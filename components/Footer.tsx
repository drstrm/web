import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import SmartLink from "@/components/SmartLink";
import { CONTACTS, SITE, SOCIALS } from "@/lib/site";

export default async function Footer() {
  const t = await getTranslations();

  return (
    <footer className="mt-16 border-t border-border bg-surface/70">
      {/* 브랜드 라인으로 본문과 끊어 준다 */}
      <div aria-hidden className="brand-gradient h-[3px] w-full" />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold tracking-tight">
              {t("meta.siteName")}
            </p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
              {t("meta.description")}
            </p>
            {/* 팀 이메일 (운영진 구글 계정) */}
            <SmartLink
              href={`mailto:${SITE.email}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <Mail className="size-3.5 shrink-0" strokeWidth={2.2} />
              <span className="break-all">{SITE.email}</span>
            </SmartLink>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-soft">
                Social
              </p>
              <div className="flex flex-wrap gap-2">
                {SOCIALS.map((s) => (
                  <SmartLink
                    key={s.href}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {s.label ?? t(s.labelKey!)}
                    <ArrowUpRight className="size-3 shrink-0 text-muted-soft" strokeWidth={2.5} />
                  </SmartLink>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-soft">
                Contact
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTACTS.map((c) => (
                  <SmartLink
                    key={c.href}
                    href={c.href}
                    className="champagne-gradient inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-champagne-ink shadow-sm transition-all hover:brightness-[1.04] active:scale-[0.97]"
                  >
                    <MessageCircle className="size-3 shrink-0" strokeWidth={2.5} />
                    {t(c.labelKey)}
                  </SmartLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-muted-soft">
          © {new Date().getFullYear()} {t("meta.siteName")}
        </p>
      </div>
    </footer>
  );
}
