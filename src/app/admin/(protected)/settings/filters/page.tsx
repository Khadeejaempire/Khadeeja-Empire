import { PageHeading } from "../../_components/AdminPage";
import { ShopFiltersManager } from "../../_components/ShopFiltersManager";
import { getShopFilterSettings } from "@/lib/storefront/filters";

export const dynamic = "force-dynamic";

export default async function ShopFiltersSettingsPage() {
  const filterSettings = await getShopFilterSettings();

  return (
    <div>
      <PageHeading
        title="Shop Filters & Attributes"
        description="Configure price slider limits, color swatches, and fabric filters for the storefront shop catalog."
      />

      <ShopFiltersManager initialSettings={filterSettings} />
    </div>
  );
}
