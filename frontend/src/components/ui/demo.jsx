import TopoField from "./topo-field";

export default function TopoFieldDemo() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-[#430000] border-2 border-white/20 shadow-2xl">
      {/* Animated White Topographic Lines with Food Silhouette */}
      <TopoField className="absolute inset-0 opacity-80" background="#430000" foodShape={true} blur={1.2} speed={0.9} />
      
      {/* Content overlay */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-6 text-center select-none">
        <span className="font-brand text-4xl sm:text-6xl font-bold tracking-wider text-white drop-shadow-md">
          FORKCAST
        </span>
        <p className="mt-2 max-w-md font-tech text-sm sm:text-base text-white/85">
          Animated white culinary topography — ambient contours forming a burger & dish in pure white ink over #430000.
        </p>
      </div>
    </div>
  );
}
