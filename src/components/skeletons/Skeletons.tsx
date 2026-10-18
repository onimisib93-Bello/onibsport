/** Shimmering placeholders shown the instant a story, hub or scores page is opened. */

function Bar({ className }: { className: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading story" className="mx-auto max-w-[1100px] px-4 pt-8 sm:px-6 sm:pt-12">
      <Bar className="h-4 w-40" />
      <Bar className="mt-6 h-12 w-full max-w-3xl sm:h-16" />
      <Bar className="mt-3 h-12 w-2/3 sm:h-16" />
      <Bar className="mt-6 h-5 w-full max-w-2xl" />
      <Bar className="mt-2 h-5 w-1/2" />
      <div className="mt-8 flex items-center gap-3 border-y border-line py-4">
        <div className="skeleton h-11 w-11 rounded-full" />
        <Bar className="h-4 w-48" />
      </div>
      <div className="skeleton mt-8 aspect-[16/9] rounded-3xl" />
      <div className="mx-auto mt-10 max-w-[680px] space-y-3">
        {["w-full", "w-[96%]", "w-[92%]", "w-[98%]", "w-[70%]"].map((w) => (
          <Bar key={w} className={`h-4 ${w}`} />
        ))}
      </div>
    </div>
  );
}

export function HubSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="bg-night px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto flex max-w-[1400px] items-center gap-5">
          <div className="h-[88px] w-[88px] animate-pulse rounded-[28%] bg-white/10" />
          <div className="h-16 w-72 animate-pulse rounded-lg bg-white/10 sm:h-24" />
        </div>
        <div className="mx-auto mt-8 grid max-w-[1400px] gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.08]" />
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div>
          <div className="skeleton aspect-[16/10] rounded-2xl" />
          <Bar className="mt-5 h-10 w-3/4" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="skeleton aspect-[16/10] rounded-xl" />
                <Bar className="mt-3 h-6 w-4/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Bar className="mb-4 h-10 w-56" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-[74px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
