import { motion } from 'framer-motion';

export default function MenuSection({ title, items, sectionRef, onAddToCart }) {
  if (!items?.length) return null;

  return (
    <section ref={sectionRef} id={title} className="scroll-mt-32">
      <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {items.map((item, index) => (
          <motion.div
            key={item._id || `${item.name}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.22)] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08]"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:h-20 sm:w-20">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="min-w-0">
                <h4 className="line-clamp-1 text-base font-bold text-white">{item.name}</h4>
                <p className="mt-1 text-sm font-medium text-[#ffcc33]">
                  {Number(item.price || 0).toLocaleString()} so&apos;m
                </p>
              </div>

              <button
                type="button"
                onClick={() => onAddToCart(item)}
                className="mt-3 inline-flex self-start rounded-full bg-[#ffcc33] px-4 py-2 text-xs font-semibold text-slate-950 transition-all duration-300 hover:brightness-105 active:scale-[0.98]"
              >
                Qo&apos;shish
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
