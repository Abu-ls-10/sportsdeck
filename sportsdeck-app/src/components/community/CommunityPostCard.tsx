import { MessageSquare, Eye } from "lucide-react";

export default function CommunityPostCard() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft hover:bg-bg-elevated transition">
      
      {/* Tag + meta */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wide text-primary-400 bg-primary-500/10 px-2 py-1 rounded">
          Analysis
        </span>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> 42
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> 1.2k
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white leading-snug">
        Is the new draft structure favoring lower seeds too much?
      </h3>

      {/* Content */}
      <p className="text-text-secondary text-sm mt-2">
        The recent changes to the lottery odds were meant to discourage tanking,
        but I’m seeing unintended consequences...
      </p>

      {/* Meta */}
      <p className="text-xs text-text-muted mt-3">
        Posted by @TacticalMind · 2 hours ago
      </p>
    </div>
  );
}