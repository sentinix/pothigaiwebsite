import { paragraphs } from "@/lib/format";

export function Paragraphs({ text, className }: { text: string | null | undefined; className?: string }) {
  return (
    <>
      {paragraphs(text).map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </>
  );
}
