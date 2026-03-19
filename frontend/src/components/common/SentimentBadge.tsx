import clsx from "clsx";

type Sentiment = "positive" | "neutral" | "negative" | null;

interface SentimentBadgeProps {
  sentiment: Sentiment;
}

const sentimentConfig: Record<
  NonNullable<Sentiment>,
  { className: string; label: string }
> = {
  positive: { className: "bg-emerald-50 text-emerald-700", label: "Positive" },
  neutral: { className: "bg-amber-50 text-amber-700", label: "Neutral" },
  negative: { className: "bg-red-50 text-red-700", label: "Negative" },
};

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const config = sentiment
    ? sentimentConfig[sentiment]
    : { className: "bg-slate-100 text-slate-500", label: "Unknown" };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
