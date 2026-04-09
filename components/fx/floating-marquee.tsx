"use client";

type FloatingMarqueeProps = {
  friendCount: number;
  countryCount: number;
  username: string;
};

// NieR-style scrolling text band — "For the Glory of Mankind" but for osu!
export function FloatingMarquee({ friendCount, countryCount, username }: Readonly<FloatingMarqueeProps>) {
  const message = `osu! Atlas \u2014 Monitoring ${friendCount} friends across ${countryCount} countries \u2014 Operator: ${username} \u2014 `;
  // repeat enough times to fill the viewport
  const repeated = message.repeat(6);

  const topMessage = "GEOGRAPHIC MONITORING SYSTEM \u2014 ALL SYSTEMS NOMINAL \u2014 REAL-TIME FRIEND TRACKING \u2014 osu! ATLAS \u2014 ";
  const topRepeated = topMessage.repeat(6);

  return (
    <>
      <div className="fx-marquee fx-marquee--top" aria-hidden="true">
        <div className="fx-marquee__track fx-marquee__track--reverse">
          <span className="fx-marquee__text">{topRepeated}</span>
          <span className="fx-marquee__text">{topRepeated}</span>
        </div>
      </div>
      <div className="fx-marquee" aria-hidden="true">
        <div className="fx-marquee__track">
          <span className="fx-marquee__text">{repeated}</span>
          <span className="fx-marquee__text">{repeated}</span>
        </div>
      </div>
    </>
  );
}
