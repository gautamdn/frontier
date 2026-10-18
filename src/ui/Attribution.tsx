// License-required attribution. Must appear in the app (here) and the README.

export function Attribution() {
  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
      <p>
        Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) ·{' '}
        <a
          href="https://withmarble.com"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          withmarble.com
        </a>{' '}
        · licensed under ODbL 1.0 (database) and CC BY-SA 4.0 (content).
      </p>
      <details>
        <summary className="cursor-pointer font-medium text-slate-700">
          Curriculum-standards provenance
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            Contains public sector information licensed under the Open
            Government Licence v3.0.
          </p>
          <p>
            © Copyright 2010 National Governors Association Center for Best
            Practices and Council of Chief State School Officers (Common Core
            State Standards).
          </p>
          <p>
            NGSS is a registered trademark of WestEd. Neither WestEd nor the
            lead states and partners that developed the Next Generation Science
            Standards were involved in the production of this product, and do
            not endorse it.
          </p>
          <p className="text-slate-400">
            C3 Framework © National Council for the Social Studies. IB PYP scope
            &amp; sequence © International Baccalaureate Organization. Standards
            are referenced by code only.
          </p>
        </div>
      </details>
    </div>
  )
}
