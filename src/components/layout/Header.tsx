import { RotateCw } from "lucide-react";

interface Props {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function HeaderLayout({ onRefresh, isLoading }: Props) {
  return (
    <header className="flex items-center justify-between mb-2 drop-shadow-md self-start w-full">
      <div className="flex items-center gap-4">
        <i className="block w-22 h-22 bg-[url(/src/assets/gurumi.svg)] bg-no-repeat bg-center bg-cover animate-gurumi-float"></i>
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">웨더리프</h1>
          <p className="text-md mt-1 font-medium">오늘 날씨 어때?</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className={`bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 text-white shadow-sm pointer-events-auto self-start
          ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-white/30"}`}
        aria-label="새로고침"
      >
        <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
      </button>
    </header>
  );
}
