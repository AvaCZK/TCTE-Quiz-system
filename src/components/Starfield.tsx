/** 純 CSS 星空特效：三層視差星點 + 流星 */
export default function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="star-layer star-layer-1" />
      <div className="star-layer star-layer-2" />
      <div className="star-layer star-layer-3" />
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <span className="meteor meteor-1" />
      <span className="meteor meteor-2" />
      <span className="meteor meteor-3" />
    </div>
  );
}
