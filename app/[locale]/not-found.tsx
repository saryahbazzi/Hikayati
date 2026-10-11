import Link from "next/link";

/** Shown for unknown pages inside a locale. Bilingual because the locale isn't available to not-found pages. */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="font-display text-4xl font-light">This page isn’t part of the story.</h1>
      <p className="font-arabic mt-3 text-2xl text-olive">هذه الصفحة ليست من الحكاية.</p>
      <p className="mt-10 flex justify-center gap-8 text-sm"><Link className="link-quiet" href="/en">Home</Link><Link className="link-quiet" href="/ar">الرئيسية</Link></p>
    </section>
  );
}
