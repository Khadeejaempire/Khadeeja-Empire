import { saveTestimonialAction, deleteTestimonialAction } from "@/actions/admin/content";
import { getDataProvider } from "@/lib/data";
import { PageHeading } from "../_components/AdminPage";
import { ManagedCollection, type ServerFormAction } from "../_components/ManagedCollection";

export const dynamic = "force-dynamic";

export default async function HomeReviewsPage() {
  const records = await getDataProvider().listTestimonials();

  return (
    <div>
      <PageHeading
        title="Homepage reviews"
        description="Manage customer testimonials shown on the homepage."
      />
      <ManagedCollection
        records={records as unknown as Array<Record<string, unknown>>}
        saveAction={saveTestimonialAction as unknown as ServerFormAction}
        deleteAction={deleteTestimonialAction as unknown as ServerFormAction}
        emptyTitle="No testimonials"
        createLabel="Add testimonial"
        fields={[
          {
            name: "rating",
            label: "Rating",
            type: "select",
            options: [
              { label: "5 stars", value: "5" },
              { label: "4 stars", value: "4" },
              { label: "3 stars", value: "3" },
              { label: "2 stars", value: "2" },
              { label: "1 star", value: "1" },
            ],
          },
          { name: "authorName", label: "Customer name", required: true },
          { name: "role", label: "Location / Subtitle (e.g. Hyderabad, Verified Buyer)" },
          { name: "quote", label: "Review text", type: "textarea", required: true },
          {
            name: "photoUrl",
            label: "Customer Wear Photo",
            type: "image",
            folder: "khadeeja/content",
            aspect: "aspect-[4/5]",
            fit: "cover",
            hint: "Upload customer photo or outfit showcase (recommended 4:5 portrait)",
          },
          {
            name: "videoUrl",
            label: "Customer Video / Reel (Optional)",
            type: "video",
            folder: "khadeeja/content",
            aspect: "aspect-[9/16]",
            fit: "cover",
            hint: "Upload short customer review clip or reel (MP4 / WebM)",
          },
          { name: "sortOrder", label: "Sort order", type: "number", min: 0 },
          { name: "active", label: "Active", type: "checkbox" },
        ]}
        summary={(r) => ({
          title: String(r.authorName),
          detail: String(r.quote),
          status: Boolean(r.active),
        })}
      />
    </div>
  );
}
