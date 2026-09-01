import Link from "next/link";
import { ArrowRight, Check, Info, MessagesSquare, Repeat, Sparkles, Users, X, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import CtaLink from "@/components/CtaLink";
import SiteFooter from "@/components/SiteFooter";
import PricingContactButton from "@/components/PricingContactButton";

export const metadata = {
  title: "요금 안내 · SocialTwin",
  description:
    "SocialTwin 요금 안내 — 가상인구 10명 무료 체험부터 건당 결제(100명 99,000원 / 500명 300,000원), 30일권(100명 규모 무제한 500,000원 / 30일)까지. 자동갱신 없는 선불 이용권이며, 모든 금액은 부가세 포함입니다.",
};

type Plan = {
  key: string;
  name: string;
  icon: React.ReactNode;
  scale: string;
  price: string;
  unit: string;
  desc: string;
  features: string[];
  /** 해당 플랜에서 제공되지 않는 항목 (무료 체험의 한계를 명시) */
  excluded?: string[];
  /** 결제 조건 고지 — 자동갱신 여부·이용기간 만료 처리처럼 결제 전에 반드시 보여야 하는 문구 */
  notice?: string;
  highlight: boolean;
  cta: "free" | "start";
  ctaLabel: string;
};

const PLANS: Plan[] = [
  {
    key: "trial",
    name: "체험",
    icon: <Sparkles size={16} />,
    scale: "가상인구 10명",
    price: "무료",
    unit: "",
    desc: "결제 없이 전체 흐름을 그대로 확인해보세요.",
    features: [
      "AI 설문 설계 (제품·가설 입력)",
      "가상인구 10명 응답 생성",
      "회원가입만으로 즉시 이용",
    ],
    excluded: ["가상인구 심층 인터뷰", "원본자료(Excel) 제공"],
    highlight: false,
    cta: "free",
    ctaLabel: "무료로 시작하기",
  },
  {
    key: "standard",
    name: "스탠다드",
    icon: <Users size={16} />,
    scale: "가상인구 100명",
    price: "99,000",
    unit: "원 / 건",
    desc: "의사결정에 바로 쓰는 표준 조사 1건.",
    features: [
      "체험 플랜의 모든 기능 포함",
      "가상인구 100명 응답 생성",
      "설문에 응답한 가상인구와 심층 인터뷰",
      "원본자료(Excel) 제공",
      "문항별 응답 분포 (전 문항)",
      "상세보고서 PDF (30p 내외)",
      "시장반응·세그먼트·가격·전략 심층 분석",
    ],
    highlight: true,
    cta: "start",
    ctaLabel: "조사 시작하기",
  },
  {
    key: "pro",
    name: "프로",
    icon: <Zap size={16} />,
    scale: "가상인구 500명",
    price: "300,000",
    unit: "원 / 건",
    desc: "표본을 키워 세부 집단까지 나눠 보는 조사.",
    features: [
      "스탠다드 플랜의 모든 기능 포함",
      "가상인구 500명 응답 생성",
      "지역·연령 등 세부 집단별 분석",
      "표본 확대에 따른 결과 안정성 향상",
    ],
    highlight: false,
    cta: "start",
    ctaLabel: "조사 시작하기",
  },
  {
    key: "pass30",
    name: "30일권",
    icon: <Repeat size={16} />,
    scale: "가상인구 100명 · 무제한",
    price: "500,000",
    unit: "원 / 30일",
    desc: "30일 동안 횟수 제한 없이 반복 검증하는 팀을 위한 선불 이용권.",
    features: [
      "스탠다드 플랜의 모든 기능 포함",
      "가상인구 100명 규모 조사 무제한",
      "결제일부터 30일간 조사 건수 제한 없음",
      "로그인 후 대시보드에서 결제",
    ],
    notice:
      "자동으로 갱신되지 않는 선불 이용권입니다. 결제일부터 30일이 지나면 이용이 자동으로 종료되며, 해지 신청이나 추가 결제가 발생하지 않습니다. 계속 이용하시려면 만료 후 다시 결제해 주세요.",
    highlight: false,
    cta: "start",
    ctaLabel: "조사 시작하기",
  },
];

/* 무료 체험과 유료 플랜의 결정적 차이 — 히어로 아래 강조 배너 */
const PAID_ONLY = [
  {
    icon: <MessagesSquare size={18} />,
    title: "가상인구 심층 인터뷰",
    desc: "숫자 뒤의 이유를 직접 물어보세요. 설문에 응답한 가상인구에게 되묻고 답을 들을 수 있습니다.",
  },
  {
    icon: <Users size={18} />,
    title: "원본자료(Excel) 제공",
    desc: "전체 응답 원본을 엑셀로 내려받아 직접 재분석하거나 사내 보고에 그대로 활용하세요.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-20 pb-14 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center">
          <Reveal>
            <div className="inline-block text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-5">
              Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4 break-keep">
              필요한 만큼만, 조사 한 건 단위로
            </h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed break-keep max-w-2xl mx-auto">
              가상인구 <strong className="text-slate-700 font-semibold">10명</strong>까지는 무료로 체험할 수 있습니다.
              그 다음부터는 조사 규모에 맞춰 건당 결제하거나, 자주 조사하신다면 30일권을 선택하세요.
              <br className="hidden sm:block" />
              <strong className="text-slate-700 font-semibold">정기 구독(자동결제) 상품은 판매하지 않습니다</strong> — 모든 상품은 결제한 그 건에만 적용되는 선불 방식입니다.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500">
                <Check size={12} strokeWidth={3} className="text-emerald-500" />
                표시된 모든 금액은 부가세(VAT) 포함 금액입니다
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500">
                <Check size={12} strokeWidth={3} className="text-emerald-500" />
                자동결제·자동갱신 없음 — 모든 상품이 선불 1회 결제입니다
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.key} delay={i * 80} className="h-full">
                <div
                  className={`h-full flex flex-col rounded-2xl p-6 transition-all ${
                    plan.highlight
                      ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-500/25 ring-1 ring-indigo-400/40 lg:-translate-y-2"
                      : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg"
                  }`}
                >
                  {plan.highlight && (
                    <div className="inline-flex w-fit items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white mb-3">
                      <Zap size={10} className="fill-white" /> 가장 많이 선택
                    </div>
                  )}

                  <div
                    className={`inline-flex w-fit items-center gap-1.5 text-xs font-bold mb-3 ${
                      plan.highlight ? "text-indigo-100" : "text-indigo-600"
                    }`}
                  >
                    {plan.icon}
                    {plan.name}
                  </div>

                  <div
                    className={`text-sm font-semibold mb-3 ${
                      plan.highlight ? "text-indigo-100" : "text-slate-500"
                    }`}
                  >
                    {plan.scale}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                        plan.highlight ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.unit && (
                      <span
                        className={`text-sm font-medium ${
                          plan.highlight ? "text-indigo-200" : "text-slate-400"
                        }`}
                      >
                        {plan.unit}
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-1 mb-3 text-[11px] font-medium ${
                      plan.highlight ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {plan.price === "무료" ? "결제 정보 등록 없음" : "부가세 포함"}
                  </div>

                  <p
                    className={`text-sm leading-relaxed break-keep mb-6 ${
                      plan.highlight ? "text-indigo-100" : "text-slate-500"
                    }`}
                  >
                    {plan.desc}
                  </p>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2 text-sm leading-snug break-keep ${
                          plan.highlight ? "text-indigo-50" : "text-slate-600"
                        }`}
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className={`flex-shrink-0 mt-1 ${
                            plan.highlight ? "text-indigo-200" : "text-emerald-500"
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.excluded?.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm leading-snug break-keep text-slate-400"
                      >
                        <X size={14} strokeWidth={3} className="flex-shrink-0 mt-1 text-slate-300" />
                        <span className="line-through decoration-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notice && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                        <Info size={12} strokeWidth={2.5} /> 결제 전 확인
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-amber-900/90 break-keep">
                        {plan.notice}
                      </p>
                    </div>
                  )}

                  {plan.cta === "free" && (
                    <CtaLink className="block text-center py-3 rounded-xl font-semibold text-sm transition-all bg-slate-900 text-white hover:bg-slate-800">
                      {plan.ctaLabel}
                    </CtaLink>
                  )}
                  {plan.cta === "start" && (
                    <CtaLink
                      dashboardHref="/design"
                      className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                        plan.highlight
                          ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                          : "border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      {plan.ctaLabel}
                    </CtaLink>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="mt-6 text-center text-xs text-slate-400 break-keep">
              표시된 &lsquo;가상인구 N명&rsquo;은 하나의 조사에 응답하는 가상 응답자 수입니다. 모든 금액은 부가세 포함이며,
              결제·환불 조건은{" "}
              <Link href="/refund" className="underline hover:text-slate-600">
                결제·환불정책
              </Link>
              을 따릅니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 유료 플랜에서만 되는 것 ── */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-8 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2 break-keep">
                  유료 플랜에서만 되는 것
                </h2>
                <p className="text-sm text-slate-500 break-keep">
                  무료 체험도 설계부터 결과 확인까지 그대로 해보실 수 있습니다. 다만 아래 두 가지는 유료 플랜부터 제공됩니다.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {PAID_ONLY.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white border border-indigo-100 p-6">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 mb-4">
                      {item.icon}
                    </div>
                    <div className="font-bold text-slate-900 mb-1.5 break-keep">{item.title}</div>
                    <p className="text-sm text-slate-500 leading-relaxed break-keep">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              자주 묻는 질문
            </h2>
          </Reveal>
          <div className="space-y-3">
            {[
              {
                q: "무료 체험과 유료 플랜은 무엇이 다른가요?",
                a: "무료 체험(가상인구 10명)도 설문 설계부터 결과 확인까지 전 과정을 그대로 이용하실 수 있습니다. 다만 설문에 응답한 가상인구와의 심층 인터뷰, 그리고 원본자료(Excel) 다운로드는 유료 플랜부터 제공됩니다.",
              },
              {
                q: "표시된 가격에 부가세가 포함되어 있나요?",
                a: "네. 페이지에 표시된 모든 금액은 부가세(VAT)가 포함된 최종 결제 금액입니다. 결제 시 별도로 추가되는 금액은 없습니다.",
              },
              {
                q: "언제 결제하나요?",
                a: "건당 결제 플랜은 설문 문항이 생성된 뒤 실제 설문조사를 진행하는 시점에 결제합니다. 문항 설계까지는 비용이 발생하지 않습니다. 30일권은 로그인 후 대시보드에서 결제하시면 즉시 적용됩니다.",
              },
              {
                q: "30일권은 정말 무제한인가요?",
                a: "네. 500,000원(부가세 포함)으로 결제일부터 30일 동안 가상인구 100명 규모의 조사를 횟수 제한 없이 이용하실 수 있습니다. 여러 안을 비교하거나 한 달 안에 반복해서 검증하는 팀이라면 건당 결제보다 유리합니다. 결제는 로그인 후 대시보드에서 진행합니다.",
              },
              {
                q: "30일권은 자동으로 갱신되나요? 해지는 어떻게 하나요?",
                a: "자동으로 갱신되지 않습니다. 30일권은 결제한 시점부터 30일 동안만 유효한 선불 이용권이며, 카드 정보를 저장해두고 다음 달에 다시 청구하는 정기결제가 아닙니다. 기간이 끝나면 자동으로 이용이 종료되므로 별도의 해지 신청을 하실 필요가 없고, 해지하지 않았다는 이유로 추가 청구가 발생하지도 않습니다. 계속 이용하시려면 만료 후 대시보드에서 다시 결제해 주시면 그 시점부터 새로 30일이 시작됩니다.",
              },
              {
                q: "30일권을 쓰다가 중간에 환불받을 수 있나요?",
                a: "가능합니다. 결제일로부터 7일 이내이고 이용 이력이 없으면 전액 환불되며, 그 밖의 경우에는 남은 기간에 비례해 환불해 드립니다. 자세한 기준은 결제·환불 정책의 \u2018이용 기간형 상품\u2019 항목을 확인해 주세요.",
              },
              {
                q: "가상인구 수가 많으면 무엇이 달라지나요?",
                a: "응답자 수가 늘어날수록 지역·연령·성별 같은 세부 집단을 나눠서 볼 수 있고, 결과가 더 안정적으로 나옵니다. 전체 경향만 빠르게 보려면 100명, 세부 집단까지 비교하려면 500명을 권합니다.",
              },
              {
                q: "세금계산서 발행이 되나요?",
                a: "네, 발행해 드립니다. 사업자 정보와 함께 문의해 주시면 담당자가 안내드립니다.",
              },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="font-semibold text-slate-900 mb-2 break-keep">{item.q}</div>
                  <p className="text-sm text-slate-500 leading-relaxed break-keep">{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4 break-keep">
              10명까지는 무료입니다
            </h2>
            <p className="text-slate-500 mb-8 break-keep">
              결제 정보 없이 지금 바로 조사를 설계해보세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <CtaLink dashboardHref="/design" className="btn-primary text-base px-8 py-4">
                조사 시작하기 <ArrowRight size={18} />
              </CtaLink>
              <PricingContactButton
                plan="요금제 전반 문의"
                className="inline-flex items-center gap-2 text-base font-semibold px-8 py-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                요금 문의하기
              </PricingContactButton>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
