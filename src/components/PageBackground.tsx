import Starfield from "./Starfield";

/**
 * 每頁的背景：底圖 + 漸層遮罩 + 星空動畫。
 * 圖片不存在時只會看到深色夜空，不會破版。
 */
export default function PageBackground({ src }: { src: string }) {
  return (
    <>
      <div
        className="page-bg"
        style={{ backgroundImage: `url("${src}")` }}
        aria-hidden="true"
      />
      <div className="page-bg-veil" aria-hidden="true" />
      <Starfield />
    </>
  );
}
