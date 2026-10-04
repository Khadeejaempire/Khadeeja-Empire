import { deleteReviewAction, updateReviewAction } from "@/actions/admin/reviews";
import { getDataProvider } from "@/lib/data";
import { AdminCard, PageHeading, StatusBadge, formatDate } from "../_components/AdminPage";

export const dynamic = "force-dynamic";

const reviewStatuses = [
  { value: "pending", label: "Mark pending" },
  { value: "approved", label: "Approve" },
  { value: "rejected", label: "Reject" },
] as const;

export default async function ReviewsPage() {
  const reviews = await getDataProvider().listReviews();

  return (
    <div>
      <PageHeading
        title="Reviews"
        description="Moderate product reviews and choose homepage highlights."
      />
      <ul className="space-y-4" aria-label="Product reviews">
        {reviews.length === 0 ? (
          <li>
            <AdminCard className="p-5 text-center text-sm text-stone-500">
              No reviews awaiting moderation. New product reviews will appear here.
            </AdminCard>
          </li>
        ) : (
          reviews.map((review) => (
            <li key={review.id}>
              <AdminCard className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-stone-900">
                        {review.title || `${review.rating}-star review`}
                      </h2>
                      <StatusBadge value={review.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      {review.authorName} · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <span
                    className="text-amber-500"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-700">{review.body}</p>
                {(review.photoUrl || review.videoUrl) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {review.photoUrl && (
                      <div className="relative aspect-[4/5] w-20 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={review.photoUrl}
                          alt="Customer review wear"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {review.videoUrl && (
                      <div className="relative aspect-[9/16] w-16 overflow-hidden rounded-lg border border-stone-800 bg-stone-900 shadow-2xs">
                        <video src={review.videoUrl} controls className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                  {reviewStatuses.map(({ value, label }) => (
                    <form action={updateReviewAction} key={value}>
                      <input type="hidden" name="id" value={review.id} />
                      <input type="hidden" name="status" value={value} />
                      <input
                        type="hidden"
                        name="isHomeFeatured"
                        value={String(review.isHomeFeatured === true)}
                      />
                      <button className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold">
                        {label}
                      </button>
                    </form>
                  ))}
                  <form action={updateReviewAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value={review.status || "pending"} />
                    <input
                      type="hidden"
                      name="isHomeFeatured"
                      value={String(!review.isHomeFeatured)}
                    />
                    <button className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold">
                      {review.isHomeFeatured ? "Remove from home" : "Feature on home"}
                    </button>
                  </form>
                  <form action={deleteReviewAction} className="sm:ml-auto">
                    <input type="hidden" name="id" value={review.id} />
                    <button
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                      aria-label={`Delete review by ${review.authorName}`}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </AdminCard>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
