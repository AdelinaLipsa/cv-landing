// A one-colour brand mark drawn in the current text colour (CSS mask), so it fits dark and light tiles alike.
export default function Mark({ src, className = "" }: { src: string; className?: string }) {
  const mask = `url(${src}) center / contain no-repeat`;
  return <span className={className} aria-hidden="true" style={{ display: "inline-block", background: "currentColor", mask, WebkitMask: mask }} />;
}
