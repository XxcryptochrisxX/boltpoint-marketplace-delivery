import { SAMPLE_TESTIMONIALS } from '../../constants';
import { Star, Quote } from 'lucide-react';

export function Testimonials() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Real Customer Reviews
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Loved by Buyers, Sellers & Drivers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SAMPLE_TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50/80 rounded-2xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-200" />
                <p className="text-slate-700 text-sm italic leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.author}</h4>
                  <p className="text-slate-500 text-xs">{item.role}</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                  {item.source}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
