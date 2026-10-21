import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowsDownUp, SoccerBall } from "@phosphor-icons/react/dist/ssr";
import type { MatchEvent } from "@/lib/live/apiFootball";
import { cn } from "@/lib/utils";
import { minuteText } from "@/lib/live/minute";

function Card({ colour }: { colour: "yellow" | "red" | "second" }) {
  if (colour === "second") {
    return (
      <span className="relative inline-block h-4 w-4" aria-hidden="true">
        <span className="absolute left-0 top-0 h-3.5 w-2.5 rounded-[2px] bg-[#f5c518]" />
        <span className="absolute bottom-0 right-0 h-3.5 w-2.5 rounded-[2px] bg-[#e5383b] ring-1 ring-white" />
      </span>
    );
  }
  return <span aria-hidden="true" className={cn("inline-block h-4 w-3 rounded-[2px]", colour === "yellow" ? "bg-[#f5c518]" : "bg-[#e5383b]")} />;
}

function EventIcon({ e }: { e: MatchEvent }) {
  switch (e.kind) {
    case "goal":
    case "penalty":
      return <SoccerBall size={18} weight="fill" className="text-ink" aria-hidden="true" />;
    case "own-goal":
      return <SoccerBall size={18} weight="fill" className="text-[#e5383b]" aria-hidden="true" />;
    case "missed-penalty":
      return <SoccerBall size={18} className="text-muted" aria-hidden="true" />;
    case "yellow":
      return <Card colour="yellow" />;
    case "red":
      return <Card colour="red" />;
    case "second-yellow":
      return <Card colour="second" />;
    case "sub":
      return <ArrowsDownUp size={18} weight="bold" className="text-sky-dark" aria-hidden="true" />;
    case "var":
      return <span className="rounded bg-ink px-1 text-[10px] font-black leading-4 text-white">VAR</span>;
  }
}

const KIND_LABEL: Record<MatchEvent["kind"], string> = {
  goal: "Goal",
  penalty: "Penalty goal",
  "own-goal": "Own goal",
  "missed-penalty": "Penalty missed",
  yellow: "Yellow card",
  "second-yellow": "Second yellow, sent off",
  red: "Red card",
  sub: "Substitution",
  var: "VAR",
};

function EventBody({ e, align }: { e: MatchEvent; align: "left" | "right" }) {
  const isGoal = e.kind === "goal" || e.kind === "penalty" || e.kind === "own-goal";
  if (e.kind === "sub") {
    return (
      <div className={cn("text-sm leading-snug", align === "left" && "text-right")}>
        {e.subKnown ? (
          <>
            <p className={cn("flex items-center gap-1 font-semibold text-ink", align === "left" && "justify-end")}>
              <ArrowUp size={12} weight="bold" className="text-[#1a8f4c]" aria-hidden="true" />
              <span className="sr-only">On:</span>
              {e.player}
            </p>
            {e.secondary && (
              <p className={cn("flex items-center gap-1 text-muted", align === "left" && "justify-end")}>
                <ArrowDown size={12} weight="bold" className="text-[#c42b2e]" aria-hidden="true" />
                <span className="sr-only">Off:</span>
                {e.secondary}
              </p>
            )}
          </>
        ) : (
          <p className="font-semibold text-ink">
            {e.player}
            {e.secondary && <span className="font-normal text-muted"> ⇄ {e.secondary}</span>}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className={cn("text-sm leading-snug", align === "left" && "text-right")}>
      <p className={cn(isGoal ? "font-display text-base font-black text-ink sm:text-lg" : "font-semibold text-ink")}>{e.player}</p>
      <p className="text-xs text-muted">
        {e.kind === "var" ? e.note : KIND_LABEL[e.kind]}
        {e.secondary && isGoal && <>, assist {e.secondary}</>}
      </p>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <li className="relative flex justify-center py-1">
      <span className="relative z-10 rounded-full bg-paper px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted ring-1 ring-line">{label}</span>
    </li>
  );
}

/** Every goal, card, substitution and VAR call, home on the left and away on the right. */
export default function MatchTimeline({ events, finished, halftimeScore }: { events: MatchEvent[]; finished: boolean; halftimeScore: string | null }) {
  const rows: ReactNode[] = [];
  let shownHalftime = false;
  events.forEach((e, i) => {
    if (!shownHalftime && e.minute > 45) {
      rows.push(<Divider key="ht" label={halftimeScore ? `Half-time ${halftimeScore}` : "Half-time"} />);
      shownHalftime = true;
    }
    const left = e.side === "home";
    rows.push(
      <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <div className={cn("flex items-center justify-end gap-3", !left && "invisible")}>{left && <EventBody e={e} align="left" />}{left && <EventIcon e={e} />}</div>
        <span className="relative z-10 grid h-9 w-12 place-items-center rounded-full bg-white text-xs font-bold tabular-nums text-ink ring-1 ring-line">
          {minuteText(e)}
        </span>
        <div className={cn("flex items-center gap-3", left && "invisible")}>{!left && <EventIcon e={e} />}{!left && <EventBody e={e} align="right" />}</div>
      </li>
    );
  });
  if (finished) {
    if (!shownHalftime && halftimeScore) rows.push(<Divider key="ht" label={`Half-time ${halftimeScore}`} />);
    rows.push(<Divider key="ft" label="Full time" />);
  }

  return (
    <ol className="relative space-y-3 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-line" aria-label="Match timeline">
      {rows}
    </ol>
  );
}
