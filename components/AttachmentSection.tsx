"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

/** 참고 이미지 첨부(선택) — 업로드/붙여넣기/드래그&드롭 + 이미지별 간단 설명.
 *  dataUrl 은 base64 data:URL. 가설 설계 시 백엔드(GPT 비전)가 분석에 활용. */
export type SurveyAttachment = {
  id: string;
  dataUrl: string;
  mime: string;
  name: string;
  description: string;
};

const MAX = 6;
const MAX_BYTES = 6 * 1024 * 1024; // 6MB/장

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function AttachmentSection({
  attachments,
  setAttachments,
}: {
  attachments: SurveyAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<SurveyAttachment[]>>;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const added: SurveyAttachment[] = [];
    let skipped = 0;
    for (const f of imgs) {
      if (f.size > MAX_BYTES) {
        skipped++;
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(f);
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          dataUrl,
          mime: f.type || "image/png",
          name: f.name || "붙여넣은 이미지",
          description: "",
        });
      } catch {
        skipped++;
      }
    }
    setAttachments((prev) => {
      const room = Math.max(0, MAX - prev.length);
      if (added.length > room) setNotice(`최대 ${MAX}장까지만 첨부됩니다.`);
      else if (skipped > 0) setNotice(`${skipped}개 파일은 건너뜀(이미지 아님 또는 6MB 초과).`);
      else setNotice(null);
      return [...prev, ...added.slice(0, room)];
    });
  }

  return (
    <div className="px-5 sm:px-8 py-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-700">
          참고 이미지 또는 설명 자료 첨부 <span className="text-slate-400 font-normal">(선택)</span>
        </label>
        <span className="text-[11px] text-slate-400">
          참고 이미지나 설명자료를 첨부하시면 보다 더 정확한 답변 생성이 가능합니다.
        </span>
      </div>

      <div
        tabIndex={0}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData?.items ?? [])
            .filter((it) => it.kind === "file")
            .map((it) => it.getAsFile())
            .filter((f): f is File => !!f);
          if (files.length) {
            e.preventDefault();
            void addFiles(files);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(Array.from(e.dataTransfer?.files ?? []));
        }}
        className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-6 text-center focus:border-indigo-400 focus:outline-none"
      >
        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-all">
          <ImagePlus size={16} />
          파일 업로드
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.currentTarget.value = "";
            }}
          />
        </label>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          또는 이 영역을 클릭한 뒤 <strong className="text-slate-500">Ctrl/⌘+V</strong> 로 붙여넣기 · 드래그&amp;드롭
        </p>
      </div>
      {notice && <p className="mt-1.5 text-[11px] text-amber-500">{notice}</p>}

      {attachments.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((a) => (
            <div key={a.id} className="flex gap-3 border border-slate-200 rounded-xl p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.dataUrl}
                alt={a.name}
                className="w-20 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] text-slate-400 truncate" title={a.name}>
                    {a.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="text-slate-300 hover:text-red-500 flex-shrink-0"
                    title="삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  value={a.description}
                  onChange={(e) =>
                    setAttachments((prev) =>
                      prev.map((x) => (x.id === a.id ? { ...x, description: e.target.value } : x)),
                    )
                  }
                  rows={2}
                  placeholder="이 이미지에 대한 간단한 설명 (예: 경쟁사 패키지, 매장 진열, UI 시안 …)"
                  className="block w-full px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg resize-none outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
