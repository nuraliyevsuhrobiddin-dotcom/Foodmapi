import { Loader2, Send, Star } from 'lucide-react';

export default function ReviewList({
  reviews,
  newReview,
  setNewReview,
  submittingReview,
  onSubmit,
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <span className="h-1 w-8 rounded-full bg-[#ffcc33]" />
        Sharhlar ({reviews.length})
      </h2>

      <div className="mb-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-6">
        <h3 className="mb-4 font-bold text-white">Fikringizni qoldiring</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewReview({ ...newReview, rating: star })}
                className="touch-target inline-flex items-center justify-center"
              >
                <Star
                  size={24}
                  className={star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                />
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              required
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Restoran haqida nima deb o'ylaysiz?"
              className="h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] p-4 pr-16 text-white outline-none transition-all duration-300 focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="touch-target absolute bottom-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc33] text-slate-950 transition-colors duration-300 hover:brightness-105 disabled:opacity-50"
            >
              {submittingReview ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.2)] backdrop-blur-md sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] font-bold text-[#ffcc33]">
                  {review.user?.username?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate font-bold text-white">{review.user?.username}</h4>
                  <p className="text-xs text-white/35">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-600 dark:bg-yellow-900/20">
                <Star size={12} className="fill-yellow-600" />
                {review.rating}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/62">{review.comment}</p>
          </div>
        ))}

        {reviews.length === 0 ? (
          <p className="py-8 text-center italic text-white/40">
            Hozircha sharhlar yo&apos;q. Birinchi bo&apos;lib fikr bildiring!
          </p>
        ) : null}
      </div>
    </section>
  );
}
