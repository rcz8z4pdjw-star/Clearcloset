import { Share2, Download } from 'lucide-react';

interface ShareCardProps {
  headline: string;
  stats: { label: string; value: string }[];
  insight: string;
}

export function ShareCard({ headline, stats, insight }: ShareCardProps) {
  const handleShare = async () => {
    const shareData = {
      title: 'My ClosetClear Stats',
      text: `${headline}\n\n${stats.map(s => `${s.label}: ${s.value}`).join('\n')}\n\n${insight}\n\nTrack your wardrobe with ClosetClear!`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.text);
      alert('Stats copied to clipboard!');
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">My Closet Analytics</h3>
        <button
          onClick={handleShare}
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <p className="text-2xl font-bold mb-6">{headline}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/10 rounded-xl p-3">
            <p className="text-white/70 text-xs mb-1">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <p className="text-white/80 text-sm italic">{insight}</p>

      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/20">
        <span className="text-xs text-white/60">Powered by</span>
        <span className="font-semibold">ClosetClear</span>
      </div>
    </div>
  );
}
