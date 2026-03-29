"use client";

type NoticeTone = "info" | "success" | "warning" | "error";

type NoticeInput = {
  title: string;
  message: string;
  tone?: NoticeTone;
};

const TONE_STYLES: Record<NoticeTone, { border: string; icon: string; titleColor: string }> = {
  success: {
    border: "border-emerald-500/40",
    icon: "✓",
    titleColor: "text-emerald-300",
  },
  error: {
    border: "border-rose-500/40",
    icon: "✕",
    titleColor: "text-rose-300",
  },
  warning: {
    border: "border-amber-500/40",
    icon: "⚠",
    titleColor: "text-amber-300",
  },
  info: {
    border: "border-primary-500/40",
    icon: "ℹ",
    titleColor: "text-primary-300",
  },
};

function ensureContainer(): HTMLElement {
  const existing = document.getElementById("__notice_container__");
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = "__notice_container__";
  container.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "z-index:9999",
    "display:flex",
    "flex-direction:column",
    "gap:10px",
    "pointer-events:none",
    "max-width:360px",
    "width:calc(100vw - 48px)",
  ].join(";");
  document.body.appendChild(container);
  return container;
}

export function showNotice({ title, message, tone = "info" }: NoticeInput) {
  if (tone === "error") console.error(`${title}\n${message}`);
  else if (tone === "warning") console.warn(`${title}\n${message}`);
  else console.log(`${title}\n${message}`);

  if (typeof window === "undefined") return;

  const container = ensureContainer();
  const styles = TONE_STYLES[tone];

  const toast = document.createElement("div");
  toast.style.cssText = [
    "pointer-events:auto",
    "opacity:0",
    "transform:translateY(8px)",
    "transition:opacity 200ms ease, transform 200ms ease",
  ].join(";");

  toast.innerHTML = `
    <div style="
      background: rgba(18,18,28,0.95);
      backdrop-filter: blur(12px);
      border: 1px solid;
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      display: flex;
      align-items: flex-start;
      gap: 12px;
    " class="${styles.border}">
      <span style="
        font-size: 13px;
        font-weight: 700;
        margin-top: 1px;
        flex-shrink: 0;
      " class="${styles.titleColor}">${styles.icon}</span>
      <div style="min-width:0">
        <p style="
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #f1f1f5;
        ">${title}</p>
        <p style="
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
          color: #9999b3;
          word-break: break-word;
        ">${message}</p>
      </div>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  const dismiss = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 220);
  };

  const timer = setTimeout(dismiss, 4000);
  toast.addEventListener("click", () => {
    clearTimeout(timer);
    dismiss();
  });
}
