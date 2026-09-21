import { Article } from "@/lib/types";

function img(seed: string) {
  return `/placeholders/${seed}.jpg`;
}

function cover(seed: string) {
  return `/covers/${seed}-cover.jpg`;
}

export const articles: Article[] = [
  {
    slug: "late-drama-title-race-blown-open",
    title: "Title race blown wide open after stoppage-time twist",
    dek: "A 94th-minute equalizer at the top of the table means the destiny of the Premier League trophy is no longer in one club's hands.",
    category: "premier-league",
    author: "Tunde Bakare",
    publishedAt: "2026-09-20T19:45:00Z",
    image: img("pl-title-race"),
    coverImage: cover("pl-title-race"),
    imageAlt: "Players celebrating a last-minute goal under floodlights",
    tags: ["Premier League", "Title Race"],
    isBreaking: true,
    status: "published",
    body: [
      "Three points looked certain until a corner in the fifth minute of stoppage time swung the destiny of this season's Premier League title race back into the balance.",
      "For eighty-nine minutes, the league leaders had done exactly what champions do: control the tempo, starve the opposition of possession in dangerous areas, and protect a single-goal lead with the kind of composure that wins titles in May rather than September. The travelling fans behind the goal had already started their countdown chants. Stewards were quietly repositioning near the tunnel. Then a set piece nobody in the ground expected to matter changed everything.",
      "The delivery itself wasn't spectacular — a flat, in-swinging ball aimed at the near post rather than the six-yard box where the leaders' back line had spent the entire half clearing everything that came near them. But a mistimed jump and a half-yard of space were all that was needed. A header, not especially powerful, squeezed under the goalkeeper's dive and rolled agonisingly across the line before a defender could hack it clear.",
      "What followed was pandemonium in one end of the stadium and a stunned, almost disbelieving silence in the other. Players who had been organizing a defensive shape moments earlier suddenly found themselves chasing shadows, chasing a ball, chasing a result that had been theirs. The referee's whistle for full time came less than sixty seconds later, and it landed like a gut punch.",
      "With six games left to play, the gap at the top is now level on points, separated only by goal difference — a margin so fine that a single refereeing decision or a deflected shot in either direction could decide where the trophy ends up in May. Both clubs still face fixtures against sides fighting for European qualification, and neither run-in is straightforward.",
      "Managers on both sides played down the significance in post-match remarks, sticking to the well-worn script of taking things \"one game at a time.\" But neither could quite hide how much the result had shifted the mood in their respective camps — one visibly frustrated at set-piece organization that will now come under scrutiny in training this week, the other buoyant at a point that, twenty minutes earlier, had looked like nothing more than damage limitation.",
      "For neutral supporters, the timing could hardly have been better. What had started to feel like a foregone conclusion, with pundits openly discussing coronation rather than competition, is suddenly one of the most open title races in years. Bookmakers reacted within minutes, slashing the odds on the chasing side and lengthening them on the leaders for the first time in two months.",
      "The two sides don't meet again this season, which means the title will most likely be decided not head-to-head but in the margins — a missed chance here, a contentious penalty there, the accumulation of small moments across six increasingly nervous weekends. If Saturday proved anything, it's that none of those moments are safe until the final whistle actually blows.",
    ],
  },
  {
    slug: "la-liga-derby-tactical-masterclass",
    title: "A derby won in midfield before it was won on the scoreboard",
    dek: "Tactical tweaks at the break turned a stalemate into a statement victory in Sunday's capital derby.",
    category: "la-liga",
    author: "Marta Delgado",
    publishedAt: "2026-09-20T21:10:00Z",
    image: img("laliga-derby"),
    coverImage: cover("laliga-derby"),
    imageAlt: "Two La Liga players challenging for the ball at midfield",
    tags: ["La Liga", "Derby"],
    status: "published",
    body: [
      "For 45 minutes, the derby was a stalemate decided by fine margins and nervous energy rather than quality — the kind of half where both benches spend more time shouting instructions than watching the ball move.",
      "Both midfields cancelled each other out almost perfectly in the opening period. Every time one side tried to build through the center of the pitch, three shirts of the opposite colour arrived to close the passing lane before the ball could travel more than ten yards. Possession statistics at the break were close to even, but so was the sense of frustration radiating from both technical areas. Chances were rare, half-chances were rarer, and the loudest cheer of the half came for a crunching but fair tackle rather than anything resembling an attack.",
      "That changed the moment the players re-emerged for the second half. A subtle change in shape — dropping one midfielder deeper to overload the space just in front of the opposition's back line — gave the eventual winners control of the ball in areas they had barely touched in the first 45 minutes. It wasn't a dramatic tactical overhaul, more a small positional adjustment, but it was enough to tilt the entire rhythm of the match.",
      "Within ten minutes of the restart, what had been a cagey, low-event derby turned into something closer to a training-ground passing drill, with the winning side stringing together sequences of fifteen and twenty passes that the opposition simply couldn't get near. The pressure told. Two goals in a seven-minute spell after the hour mark — the first a driven finish from the edge of the box, the second a calm, almost casual side-foot after a defense-splitting through ball — turned a nervy afternoon into a result that will sting for weeks on the losing side of the city.",
      "What made the sequence particularly painful for the away bench was how avoidable it looked in hindsight. The overload down the inside channel that led to the second goal wasn't a fluke or a moment of individual brilliance; it was the same pattern repeating itself for the third time in that seven-minute window, and the opposition never adjusted to stop it.",
      "Post-match, the winning manager was characteristically modest about the halftime adjustment, calling it \"a small thing, nothing revolutionary\" — but insiders at the club described it as exactly the kind of in-game reading that separates coaches capable of winning derbies from those who merely turn up hoping their players perform.",
      "The result does more than settle bragging rights for the weekend. It opens daylight in the table at a point in the season when every dropped point starts to matter, and it hands the winning side momentum heading into a run of fixtures that, on paper, looks considerably kinder than what they've just come through.",
    ],
  },
  {
    slug: "serie-a-veteran-keeper-record-clean-sheet",
    title: "Veteran keeper breaks decade-old clean sheet record",
    dek: "A commanding display between the posts wrote his name into the Serie A history books.",
    category: "serie-a",
    author: "Luca Moretti",
    publishedAt: "2026-09-19T18:30:00Z",
    image: img("seriea-keeper"),
    coverImage: cover("seriea-keeper"),
    imageAlt: "A goalkeeper making a diving save",
    tags: ["Serie A", "Records"],
    status: "published",
    body: [
      "It took a fingertip save in the final minute to confirm what statisticians had been quietly tracking for weeks: a new record for consecutive clean sheets in a single Serie A campaign.",
      "The save itself will be replayed for years. A deflected shot from the edge of the box looked destined for the top corner until a full-stretch dive turned it around the post at the last possible instant — the kind of reflex stop that looks almost accidental in real time and only reveals its full difficulty when you watch it back in slow motion. The stadium held its breath for the two seconds it took the ball to travel, then erupted the moment it went wide.",
      "That the moment arrived in the 94th minute, with his side already three goals to the good and the result long since decided, only added to the theatre. There was no competitive necessity for the save — nothing riding on it beyond a number in a record book. And yet the 36-year-old threw himself at it with the same urgency he'd have shown in a cup final, which longtime teammates say is exactly the point: it's that refusal to switch off, even in a game that's already won, that has made this run possible in the first place.",
      "The keeper has been the platform for his side's surprise push toward European qualification all season, conceding just four goals in what is now his fourteenth appearance without defeat. Opposition strikers who have faced him this campaign describe a goalkeeper who has somehow gotten better with age rather than in spite of it — reading crosses earlier, commanding his box with more authority, and rarely beaten by anything he should reasonably be expected to save.",
      "What makes the record more remarkable is the context in which it's been built. His club started the season being talked about as relegation candidates by most preseason pundits, after a summer that saw three key defenders leave and no marquee signings arrive to replace them. Instead, built around a defense that has had to learn each other's habits on the fly, they've climbed into the top half of the table — and their goalkeeper has been the one constant absorbing pressure that, by rights, should have found the net far more often than it has.",
      "Teammates lifted him onto their shoulders at full time in a rare scene of celebration usually reserved for goalscorers rather than the man tasked with preventing them. It's a small but telling detail about how this Serie A season is shaping up: with the traditional powerhouses stumbling more than usual, defensive solidity built around one outstanding individual is proving just as valuable as attacking flair further up the pitch.",
      "The obvious question now is how long the run can continue. His side face two of the division's more potent attacks in their next three fixtures, and history suggests even the best runs eventually meet the finish they can't prevent. For now, though, the record stands, the celebrations are still fresh, and a goalkeeper who many assumed was in the twilight of his career has given his club — and himself — one more reason to believe this season could end somewhere special.",
    ],
  },
  {
    slug: "bundesliga-wonderkid-hat-trick",
    title: "18-year-old's hat-trick announces a new Bundesliga star",
    dek: "Three goals in twenty second-half minutes turned a routine fixture into a coronation.",
    category: "bundesliga",
    author: "Hans Weber",
    publishedAt: "2026-09-18T17:00:00Z",
    image: img("bundesliga-wonderkid"),
    coverImage: cover("bundesliga-wonderkid"),
    imageAlt: "A young footballer celebrating a goal with arms outstretched",
    tags: ["Bundesliga", "Rising Star"],
    status: "published",
    body: [
      "Scouts already knew the name. After Saturday, so does everyone else.",
      "For the first hour, this looked like exactly the kind of mid-table fixture that gets forgotten by Monday — a scrappy, disjointed game with few clear chances and even fewer moments worth remembering. Then, in the space of twenty second-half minutes, an 18-year-old forward turned a forgettable afternoon into the kind of performance that ends up in career retrospectives a decade later.",
      "The first goal was a striker's finish in the purest sense: a half-chance inside the box, a defender arriving a fraction of a second too late, and a composed side-foot into the corner that suggested nerves simply weren't part of the equation. The second, seven minutes later, showed a different skill entirely — an audacious first-time strike from outside the area that the goalkeeper barely saw until it was already past him. The third, completing the hat-trick with fifteen minutes still to play, was almost cruel in its simplicity: a run in behind the last defender, a composed touch to take the ball around the onrushing keeper, and a finish that never looked in doubt from the moment he crossed the halfway line.",
      "What turned a tight, nervous game into a rout was as much about momentum as it was about individual quality. Once the second goal went in, the opposition's shape audibly cracked — defenders started pushing higher to compensate, midfielders began gambling on tackles they wouldn't normally attempt, and the gaps that had been carefully closed for an hour suddenly opened up everywhere. The teenager, and the teammates feeding him, exploited every one of them.",
      "The performance immediately set off transfer speculation that his club will now have to manage carefully in the weeks ahead. Agents representing clubs across three different leagues were reportedly in the stadium, and by full time, at least two major sporting outlets had already published \"everything you need to know\" profiles — the kind of instant deep-dive usually reserved for players who've been household names for years, not teenagers making their sixth senior start.",
      "What makes the timing notable is how recently this player was still training with the club's under-19 side. He's featured in the senior squad for barely two months, promoted after an injury crisis left the first-team coach short of attacking options, and has gone from fringe squad player to the most talked-about teenager in the division in the space of a single half of football.",
      "The club's sporting director, when asked directly after the match whether a new contract was imminent, gave the kind of carefully worded non-answer that usually means negotiations are already well underway. Given the performance, few would blame the club for wanting to secure his signature before the offers currently being drafted across the continent land on his agent's desk.",
      "For now, though, the numbers do the talking: a hat-trick, a man-of-the-match award decided before the final whistle, and a teenager who — depending on who you ask in the stands after the game — is already being talked about as a candidate for the next international squad. Whether that's premature or prophetic is a conversation for another day. On Saturday, it was simply devastating.",
    ],
  },
  {
    slug: "ucl-group-stage-comeback",
    title: "Down by two at the break, the comeback nobody saw coming",
    dek: "A Champions League group-stage tie swung from procession to classic in the space of a second half.",
    category: "champions-league",
    author: "Ines Moreau",
    publishedAt: "2026-09-17T20:00:00Z",
    image: img("ucl-comeback"),
    coverImage: cover("ucl-comeback"),
    imageAlt: "Fans celebrating in a packed stadium under the Champions League lights",
    tags: ["Champions League", "Comeback"],
    status: "published",
    body: [
      "At half-time, the away end had gone quiet and the home fans were already planning their celebrations. Nobody told the visitors.",
      "The first 45 minutes had gone almost exactly as the home side would have scripted it. Two goals inside the opening half-hour, both born from the same pattern of quick transitions the visitors simply couldn't cope with, had the stadium in full voice and the away bench visibly rattled. By the time the whistle blew for half-time, the broadcast graphics were already showing win-probability numbers that made the outcome look like a formality.",
      "What happened in the dressing room during that fifteen-minute interval remains, by the manager's own admission afterward, \"just some honest conversations\" — but whatever was said, it produced one of the more dramatic turnarounds this competition has seen in recent seasons. Three second-half substitutions changed the tempo of the game entirely, injecting pace and directness into an approach that had looked toothless for the entire first half.",
      "The comeback didn't arrive gradually. It arrived in a rush: three goals in eighteen minutes, the first a scrappy close-range finish from a corner that barely anyone in the ground saw cleanly, the second a stunning strike from distance that flew in off the underside of the bar, and the third — the goal that will be replayed for years — a flowing team move finished with an outrageous piece of skill that left three defenders on the turf and the goalkeeper with no chance whatsoever.",
      "The noise inside the stadium in the minutes after that third goal was unlike anything most of the away fans in attendance said they'd experienced. Grown adults in replica shirts were seen in tears. Players who had looked shattered and demoralized at half-time were sprinting the length of the pitch to celebrate with substitutes who'd only been on the field for a matter of minutes.",
      "For the home side, the collapse raises uncomfortable questions that will follow them into their next fixture. Leading by two goals with 45 minutes to defend is, at this level, usually a formality — the kind of position elite sides are specifically coached and drilled to protect. That it unraveled so completely, and so quickly, will prompt exactly the kind of soul-searching no club wants heading into a run of fixtures that only gets tougher from here.",
      "It leaves the group standings wide open heading into the final matchday, with all four sides in the section still able, mathematically, to finish anywhere from first to last. Whatever else happens between now and then, neither set of fans is likely to forget this particular Tuesday night in a hurry — one for entirely different reasons than the other.",
    ],
  },
  {
    slug: "super-eagles-squad-announcement",
    title: "Super Eagles name provisional squad ahead of double-header",
    dek: "Two uncapped players earn first call-ups as the head coach reshapes his options ahead of a crucial pair of fixtures.",
    category: "nigeria-football",
    author: "Chiamaka Nwosu",
    publishedAt: "2026-09-20T12:00:00Z",
    image: img("super-eagles-squad"),
    coverImage: cover("super-eagles-squad"),
    imageAlt: "Nigeria national football team players training together",
    tags: ["Super Eagles", "Nigeria"],
    isBreaking: true,
    status: "published",
    body: [
      "The Super Eagles technical crew has named a 27-man provisional squad for the upcoming double-header, with two uncapped domestic-league players included for the first time — a decision that has already split opinion among fans and pundits alike.",
      "Both inclusions come directly off the back of standout starts to the NPFL season, and their call-ups continue the federation's stated push to scout more heavily from the local league rather than leaning almost exclusively on the European-based contingent that has dominated squad lists in recent years. For a domestic league that has long complained about being overlooked at international level, the timing feels significant.",
      "It hasn't gone unnoticed that both uncapped players have been directly involved in some of the NPFL's most talked-about performances this season — one a defensive midfielder whose composure on the ball has drawn comparisons to Super Eagles legends of a previous generation, the other a wide forward whose pace has been a genuine problem for opposition defenses all campaign. Whether either translates that domestic form to international level remains, of course, the entire question camp will be built around answering.",
      "The squad list also confirms the continued absence of two established regulars still working their way back from injury, a gap that partly explains why the door has opened for fresh faces at this particular moment rather than further down the line. The head coach has been candid in recent press briefings about wanting depth options he can trust, rather than simply recalling the same names out of habit.",
      "Reaction across Nigerian football media has been largely positive, though not without the usual pockets of skepticism that accompany any squad reshuffle — some pundits questioning whether either debutant is ready for the step up, others arguing the opposite: that this is exactly the kind of bold selection the national team has been too cautious to make in recent cycles.",
      "The call-ups reward strong starts to the NPFL season and continue the federation's stated push to scout more heavily from the local league, a policy shift that, if it continues, could meaningfully change the pipeline between domestic football and the national team over the coming years.",
      "The squad will be trimmed further before camp opens next week, with the head coach expected to explain his final selection — and, inevitably, field questions about the two new faces — at a press conference on Monday. For now, though, the biggest talking point isn't who made the final cut, but what this provisional list signals about where the technical crew sees the next generation of Super Eagles talent coming from.",
    ],
  },
  {
    slug: "nigeria-womens-team-qualifier-win",
    title: "Nigeria's women close in on qualification with commanding win",
    dek: "A dominant second-half display puts the team firmly in control of their qualifying group.",
    category: "nigeria-football",
    author: "Chiamaka Nwosu",
    publishedAt: "2026-09-16T19:00:00Z",
    image: img("nigeria-women-team"),
    coverImage: cover("nigeria-women-team"),
    imageAlt: "Nigerian women's national football team celebrating",
    tags: ["Nigeria", "Women's Football"],
    status: "published",
    body: [
      "A goal in each half was enough to secure a result that leaves Nigeria needing just a point from their final group game to confirm qualification — a position that looked far from certain twenty minutes into what turned into a comfortable evening.",
      "The opening half-hour was cagier than the eventual scoreline suggests. The opposition, fighting for their own qualification hopes, set up in a deep, disciplined block that frustrated Nigeria's usual patterns of attack for long stretches. Chances were scarce, and the frustration on the touchline was visible as promising moves broke down one after another against a well-organized defense.",
      "The breakthrough, when it arrived just before the interval, came from exactly the kind of patient build-up play the coaching staff have been drilling in training for weeks — a switch of play to the flank, a driven low cross, and a composed first-time finish that gave Nigeria the lead at exactly the moment their opponents had started to look the more likely to score.",
      "Whatever was said in the dressing room at half-time clearly worked. Nigeria emerged for the second half a different side entirely — higher press, quicker transitions, and a level of control that had the opposition chasing shadows for the majority of the remaining 45 minutes. The second goal, when it came just after the hour mark, was almost a formality by that point: a well-worked short corner routine that ended with a close-range finish few goalkeepers at any level would have saved.",
      "The head coach praised her side's control of midfield as the difference-maker, having identified it as an area for improvement after a narrower-than-expected win in the previous round. \"We spoke all week about being braver on the ball in the middle of the pitch,\" she noted afterward, \"and I thought in the second half especially, you saw exactly that.\"",
      "The result does more than move Nigeria closer to qualification on paper — it also settles some of the nervous energy that had crept into the camp following a scrappier-than-expected performance in the previous fixture. Confidence, by every account from within the squad, is now firmly back on the rise heading into a final group game that Nigeria will now approach knowing a single point secures their spot in the next round.",
      "For a squad that has talked openly about wanting to build a sustained run at this tournament rather than simply making up the numbers, Tuesday's performance — patient, composed, and ultimately dominant — was exactly the statement they needed to make.",
    ],
  },
  {
    slug: "npfl-matchday-review",
    title: "NPFL matchday review: title chasers held, relegation fight tightens",
    dek: "A weekend of surprises across the league table, from the top four to the bottom three.",
    category: "npfl",
    author: "Emeka Obi",
    publishedAt: "2026-09-21T08:00:00Z",
    image: img("npfl-matchday"),
    coverImage: cover("npfl-matchday"),
    imageAlt: "NPFL match action on a Nigerian football pitch",
    tags: ["NPFL", "Matchday Review"],
    status: "published",
    body: [
      "The two clubs level on points at the top of the NPFL table both dropped points this weekend, keeping the title race congested with two-thirds of the season gone and setting up a run-in that promises to be genuinely unpredictable.",
      "Neither result was for lack of trying. The league leaders were held to a goalless draw away from home in a match dominated by defensive organization on both sides — chances were rare, and the point, while not what either side wanted walking in, at least keeps the gap at the top unchanged heading into a run of fixtures that gets noticeably tougher for the leaders from here.",
      "Their closest challengers fared little better, conceding a stoppage-time equalizer away from home in a result that will feel, in the cold light of Monday morning, like two points dropped rather than one gained. It's the kind of late concession that tends to linger in a dressing room for longer than the ninety minutes it took to happen.",
      "At the other end of the table, the picture was just as dramatic. A crucial win pulled one side out of the relegation zone for the first time since matchday three — a result built on a disciplined defensive display and a single well-taken counter-attacking goal that their fans, packed into a stadium that has felt increasingly tense in recent weeks, greeted with the kind of relief usually reserved for genuine survival-defining moments.",
      "The mood at the bottom of the table couldn't have been more different for the side who remain rooted to last place after a last-minute penalty miss that will sting for weeks. Awarded a clear opportunity to snatch a point deep into stoppage time, their designated taker saw his effort saved low to the goalkeeper's left — a moment replayed endlessly on social media in the hours since, not out of cruelty, but because everyone watching understood exactly what was riding on it.",
      "Beyond the results themselves, there's a broader story developing across the division this season: attendances continue to climb across the NPFL, with several clubs reporting their highest gates in three seasons. Whether that's down to genuinely tighter, more competitive football, growing investment in matchday experience, or simply a title race and relegation battle both still wide open with a third of the season to play, the numbers suggest something is shifting in how Nigerian fans are engaging with the domestic league.",
      "With the title race still level, the relegation fight tightening rather than resolving, and crowds growing rather than shrinking, this is shaping up to be one of the more compelling NPFL seasons in recent memory — for all the right reasons, and, for at least one club this weekend, some genuinely heartbreaking ones too.",
    ],
  },
  {
    slug: "npfl-rivers-united-continental-run",
    title: "Rivers United's continental run has NPFL clubs believing again",
    dek: "A run to the quarter-finals of the CAF Confederation Cup is reviving hopes that Nigerian clubs can compete continentally.",
    category: "npfl",
    author: "Emeka Obi",
    publishedAt: "2026-09-14T15:30:00Z",
    image: img("rivers-united-caf"),
    coverImage: cover("rivers-united-caf"),
    imageAlt: "Rivers United players in continental competition action",
    tags: ["NPFL", "CAF Confederation Cup"],
    status: "published",
    body: [
      "It has been a decade since an NPFL side went this far in continental competition, and Rivers United's run to the quarter-finals of the CAF Confederation Cup has reignited a debate about investment in the domestic league that had, until recently, gone quiet.",
      "The run hasn't come easily. Each of the three knockout rounds so far has gone to the wire — a penalty shootout in the first, a stoppage-time winner away from home in the second, and a nervy one-goal aggregate victory in the most recent tie against opposition many pre-tournament pundits had tipped to go further than Rivers United themselves. If there's a theme running through the campaign, it's a squad that has found a way to win close matches rather than simply overwhelming opponents.",
      "Squad depth and a settled coaching staff have been cited by those close to the club as the biggest factors behind the turnaround, particularly after a difficult start to the campaign domestically that saw the club sitting outside the top half of the NPFL table as recently as matchday six. Continuity in selection, rather than wholesale changes after every disappointing result, appears to have paid off just as the season has progressed.",
      "What makes the run resonate beyond Rivers United's own fanbase is the broader statement it makes about NPFL clubs on the continental stage. For years, the conversation around Nigerian football's underperformance in CAF competitions has centered on funding gaps, squad turnover, and an inability to retain key players through a full continental campaign. Rivers United's quarter-final berth doesn't resolve any of those structural issues on its own, but it does offer proof of concept — evidence that a domestic side with the right planning and a bit of momentum can still compete.",
      "Club officials have been careful not to get ahead of themselves publicly, with the technical director repeating in recent interviews that the focus remains \"one game at a time\" — but privately, sources close to the squad describe a genuine belief within the camp that a semi-final berth, something no NPFL club has reached in this competition in years, is not out of reach.",
      "The draw for the quarter-final stage will be watched closely across Nigerian football, not just by Rivers United supporters but by rival NPFL clubs who see the run as validation that continental success isn't reserved for teams from wealthier leagues elsewhere on the continent. Win or lose from here, the run has already changed the conversation — from whether NPFL clubs belong on this stage, to how far they might actually go.",
    ],
  },
  {
    slug: "transfer-window-striker-domino-effect",
    title: "One striker signing could set off a domino effect across Europe",
    dek: "Sources close to the negotiations say a deal is closer than either club has publicly admitted.",
    category: "transfers",
    author: "Onibsport Transfers Desk",
    publishedAt: "2026-09-20T10:15:00Z",
    image: img("transfer-domino"),
    coverImage: cover("transfer-domino"),
    imageAlt: "A footballer holding a new club's shirt at a press unveiling",
    tags: ["Transfers", "Rumour Mill"],
    status: "published",
    body: [
      "Talks over a marquee striker move have advanced further than either club has let on publicly, according to sources close to the negotiations — and the ripple effects, if the deal completes, could reshape multiple squads well beyond the two clubs directly involved.",
      "The framework of a deal has reportedly been on the table for close to two weeks now, with the sticking points less about the transfer fee itself — which both sides are said to have broadly agreed on — and more about structuring the payment across installments that work for the selling club's financial fair play calculations. That kind of detail rarely makes headlines, but it's often exactly what determines whether a rumored move actually happens on the timeline fans expect.",
      "What makes this particular deal significant isn't just the player involved, but what it would trigger elsewhere. Should the move go through, it is expected to trigger at least two further moves as the selling club looks to reinvest immediately in the winter window rather than waiting until next summer — a sign of how tightly this particular domino chain has already been mapped out behind the scenes by intermediaries on all sides.",
      "One of those secondary moves reportedly involves a replacement striker already being lined up, with informal contact made with the player's representatives weeks before the primary deal has even been finalized — the kind of parallel groundwork that has become standard practice among clubs operating with tight recruitment budgets and little margin for a gap in the squad, even a temporary one.",
      "Nothing is signed yet, and both parties have downplayed the story when approached directly by reporters this week — standard practice at this stage of any negotiation, and not necessarily a signal that talks have stalled. If anything, sources familiar with how both clubs typically operate suggest the public silence is a reasonably reliable indicator that things are progressing rather than the opposite.",
      "The player himself has given nothing away in recent public appearances, sticking to well-rehearsed lines about focusing on his current club's remaining fixtures. But teammates have noted a shift in his body language in training over the past fortnight — nothing dramatic, but the kind of subtle change that often accompanies a player who knows a decision about his future is close.",
      "For now, the shape of a deal is reportedly already on the table, and the coming days are expected to determine whether this becomes one of the window's defining moves or another near-miss that dissolves at the final stage. Either way, the chain of consequences already being planned around it suggests this single transfer could end up reshaping far more than just one club's attack.",
    ],
  },
  {
    slug: "transfer-nigerian-teenager-europe-move",
    title: "NPFL breakout star attracting scouts from three European leagues",
    dek: "A teenage midfielder's rapid rise through the Nigerian league has scouts from England, Portugal and Belgium taking notice.",
    category: "transfers",
    author: "Onibsport Transfers Desk",
    publishedAt: "2026-09-19T09:00:00Z",
    image: img("npfl-teen-scout"),
    coverImage: cover("npfl-teen-scout"),
    imageAlt: "A young NPFL midfielder controlling the ball during a match",
    tags: ["Transfers", "NPFL", "Nigeria"],
    status: "published",
    body: [
      "Scouts from at least three European leagues have watched the 19-year-old NPFL midfielder in person over the past month, according to people familiar with the visits — a level of attention that has turned a promising domestic breakout into one of the more closely tracked young talents on the continent.",
      "The interest reportedly spans England's second tier, a mid-table Portuguese top-flight club known for developing and reselling young talent at significant profit, and a Belgian side that has built its entire recruitment model around identifying undervalued players from leagues that traditional European scouting networks tend to overlook. That three clubs with such different profiles have independently arrived at the same conclusion says something about how highly regarded this player already is.",
      "What's drawing scouts isn't a single standout performance but a consistency that has held up across an entire NPFL season — composure on the ball under pressure, a passing range that looks unusual for a player his age, and a tactical intelligence in reading when to drive forward and when to hold position that coaches typically spend years drilling into midfielders, not something you expect to see fully formed at nineteen.",
      "His club has publicly stated it will not sell below a set valuation, a figure that, by NPFL standards, would represent one of the more significant transfer fees generated by a domestic club in recent memory. Whether that number is negotiable in practice or a genuine red line remains to be seen, but the public positioning is itself a sign of how highly the player's development is now regarded domestically — a marked shift from an era when NPFL clubs were routinely accused of letting talent leave for a fraction of its value.",
      "For the player himself, the sudden scouting attention has been, by his own admission in a recent interview, \"a lot to take in.\" He described finding out that senior scouts had been watching several of his matches only after the fact, when club officials began fielding calls from intermediaries representing multiple European sides within the same week.",
      "Agents and intermediaries close to the situation suggest a move is more likely in the upcoming window than next summer, driven partly by the competitive interest itself — none of the three clubs reportedly want to risk waiting and losing out to a rival suitor. For NPFL football, a successful move at this valuation would be more than just good news for one player and one club; it would be another data point in the case that Nigerian domestic football can develop, not just discover, genuine European-level talent.",
    ],
  },
  {
    slug: "video-matchday-highlights-roundup",
    title: "Every goal from a weekend that had everything",
    dek: "Watch the goals, the saves, and the moment that will be replayed all week.",
    category: "premier-league",
    author: "Onibsport Video Desk",
    publishedAt: "2026-09-20T22:00:00Z",
    image: img("video-highlights"),
    coverImage: cover("video-highlights"),
    imageAlt: "Stadium floodlights over a packed football ground at night",
    tags: ["Highlights", "Video"],
    featuredVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "published",
    body: [
      "From a stoppage-time title-race twist to a teenager's hat-trick in Germany, this was a weekend that delivered from the first whistle to the last — the kind of round of fixtures that reminds you why you cleared your entire Saturday for it in the first place.",
      "The headline moment, unsurprisingly, is the 94th-minute equalizer that blew the Premier League title race wide open, but it's far from the only story worth your time this week. There's the tactical switch that turned a tense derby into a statement win, the veteran goalkeeper who broke a decade-old clean sheet record with a save that had absolutely nothing riding on it, and a Champions League comeback that went from procession to classic in the space of eighteen frantic second-half minutes.",
      "Watch the full round-up above for every goal, mapped out in the order they happened, along with the moments the broadcast cameras almost missed — the disbelieving reaction on the bench after that title-race equalizer, the exact instant the derby's momentum flipped after halftime, and the celebration that will define one 18-year-old's breakout weekend for years to come.",
      "For the written match reports, tactical breakdowns, and the stories behind each result, catch up on the full coverage below — starting with the title race that just got a lot more interesting, and working through every league and competition covered on Onibsport this week.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(slug: string): Article[] {
  return articles
    .filter((a) => a.category === slug && a.status === "published")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getLatestArticles(limit = 8): Article[] {
  return [...articles]
    .filter((a) => a.status === "published")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

export function getBreakingArticles(): Article[] {
  return articles.filter((a) => a.isBreaking && a.status === "published");
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return articles
    .filter((a) => a.slug !== article.slug && a.category === article.category && a.status === "published")
    .slice(0, limit);
}
