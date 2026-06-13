import { useState } from 'react';
import { Phone, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export default function CrisisHelpline() {
  const [isOpen, setIsOpen] = useState(false);

  const helplines = [
    {
      name: 'Tele-MANAS (Govt. of India)',
      contact: '14416 or 1800-891-4416',
      timing: '24/7 · Toll-free',
      desc: 'National tele-mental health programme, confidential support.'
    },
    {
      name: 'Vandrevala Foundation',
      contact: '+91 9999 666 555',
      timing: '24/7 · Call & WhatsApp',
      desc: 'Free, confidential mental health counseling by trained experts.'
    },
    {
      name: 'iCall (TISS)',
      contact: '+91 91529 87821',
      timing: 'Mon-Sat · 10:00 AM - 8:00 PM',
      desc: 'Trained professionals providing psycho-social counseling.'
    }
  ];

  return (
    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 shadow-sm animate-fadeInUp">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
        aria-expanded={isOpen}
        aria-controls="helpline-details"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
              Need immediate support?
            </h3>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">
              Access free, confidential 24/7 student mental health helplines in India.
            </p>
          </div>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-rose-600" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-rose-600" aria-hidden="true" />
          )}
        </div>
      </button>

      {isOpen && (
        <div id="helpline-details" className="mt-4 pt-3 border-t border-rose-100 space-y-3">
          {helplines.map((h, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-rose-50">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-800">{h.name}</h4>
                <p className="text-[11px] text-gray-500 font-medium">{h.desc}</p>
                <span className="inline-block text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {h.timing}
                </span>
              </div>
              <a
                href={`tel:${h.contact.split(' ')[0].replace(/[^0-9]/g, '')}`}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Call {h.contact.split(' ')[0]}</span>
              </a>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 font-semibold text-center italic mt-1">
            Remember, seeking help is a sign of strength. You are not alone.
          </p>
        </div>
      )}
    </div>
  );
}
