import { saveHeroSlideAction, deleteHeroSlideAction } from "@/actions/admin/content";
import { getDataProvider } from "@/lib/data";
import { PageHeading } from "../_components/AdminPage";
import { ManagedCollection, type ServerFormAction } from "../_components/ManagedCollection";

export const dynamic = "force-dynamic";

export default async function HeroSlidesPage() {
  const records = await getDataProvider().listHeroSlides();

  return (
    <div>
      <PageHeading
        title="Hero slides"
        description="Manage homepage hero media, copy, links and ordering."
      />

      <ManagedCollection
        records={records as unknown as Array<Record<string, unknown>>}
        saveAction={saveHeroSlideAction as unknown as ServerFormAction}
        deleteAction={deleteHeroSlideAction as unknown as ServerFormAction}
        emptyTitle="No hero slides"
        createLabel="Add hero slide"
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "subtitle", label: "Subtitle" },
          {
            name: "image",
            label: "Image (desktop) — Recommended 4:5",
            type: "image",
            required: true,
            folder: "khadeeja/hero",
            aspect: "aspect-4/5",
            fit: "contain",
            hint: "Recommended 4:5 ratio (e.g. 1080×1350px or 1200×1500px). Shown on laptop/desktop.",
          },
          {
            name: "mobileImage",
            label: "Image (mobile)",
            type: "image",
            folder: "khadeeja/hero",
            aspect: "aspect-square",
            fit: "cover",
            hint: "Optional. Shown on phones instead of desktop image (1080×1080px 1:1 square). Leave empty to reuse desktop image on mobile.",
          },
          { name: "imageAlt", label: "Image alt text" },
          { name: "cta", label: "Button label" },
          { name: "ctaLink", label: "Button link" },
          { name: "sortOrder", label: "Sort order", type: "number", min: 0 },
          { name: "active", label: "Active", type: "checkbox" },
        ]}
        summary={(r) => ({
          title: String(r.title),
          detail: String(r.subtitle || r.image),
          status: Boolean(r.active),
        })}
      />
    </div>
  );
}

