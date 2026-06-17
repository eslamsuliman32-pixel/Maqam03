// src/components/SimpleTerminologyPanel.tsx

import React from 'react';
import { BookOpen } from 'lucide-react';

interface Term {
  title: string;
  desc: string;
}

const terms: Term[] = [
  {
    title: 'نقص الموريم (Mora Gap)',
    desc: 'الفراغات اللي بتحصل في نص الجملة وممكن تستغلها في كتم الصوت، أو السكوت قبل كلمات معينة لزيادة التركيز عليها.',
  },
  {
    title: 'مستودع الكيمياء (Acoustic Match)',
    desc: 'ازاي الحروف المجهورة والمهموسة وسرعة النبرات بتتناغم مع آلة السينث أو الوتريات المقترحة.',
  },
  {
    title: 'تزامن الأونست (Onset Locks)',
    desc: 'مطابقة كلماتك مع اللحظة الدقيقة لنزول السنير أو الكيك في البيت لتأكيد الإيقاع.',
  },
  {
    title: 'مقياس الديسيماتور (Decimator Index)',
    desc: 'درجة كثافة ضربات الآلات الإضافية ومعرفة هل الآلة القائدة هادية ولا سريعة عشان توازن كلامك.',
  },
];

export const SimpleTerminologyPanel: React.FC = () => {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d111b] p-5 text-right font-sans" dir="rtl">
      <h3 className="flex items-center gap-2 text-sm font-black text-white">
        <BookOpen className="h-4 w-4 text-emerald-300" />
        قاموس المشرط البسيط
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {terms.map((term, index) => (
          <article
            key={index}
            className="rounded-2xl border border-white/15 bg-white/[0.02] p-4 text-right"
          >
            <h4 className="text-xs font-black text-white">{term.title}</h4>
            <p className="mt-2 text-sm leading-6 text-white/55">{term.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
