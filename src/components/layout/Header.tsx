export default function HeaderLayout() {
  return (
    <header className="flex items-center gap-4 mb-3 drop-shadow-md self-start">
      <i className="block w-22 h-22 bg-[url(/src/assets/gurumi.svg)] bg-no-repeat bg-center bg-cover animate-gurumi-float"></i>
      <div className="text-left">
        <h1 className="text-3xl font-extrabold tracking-tight">웨더리프</h1>
        <p className="text-md mt-1 font-medium">오늘 날씨 어때?</p>
      </div>
    </header>
  );
}
