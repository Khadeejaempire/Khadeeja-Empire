-- Khadeeja Empire demo seed. Run after database/schema.sql in the Supabase SQL editor.
-- This seed contains only current Khadeeja Empire catalog/media and safe demo settings.

insert into categories (id, slug, name, description, image, sort_order)
values
  ('category-short-kurtis', 'short-kurtis', 'Short Kurtis', 'Tradition, cut for today. Breathable cottons and modern silhouettes.', '/assets/images/3932554101906649932.jpg', 0),
  ('category-coord-sets', 'coord-sets', 'Co-ord Sets', 'One set. Endless moments. Crafted co-ord sets for every mood.', '/assets/images/3895371692098630743.jpg', 1),
  ('category-everyday-tops', 'everyday-tops', 'Everyday Tops', 'Easy elegance for daily wear. Tops that move with you.', '/assets/images/3923489547532341720.jpg', 2),
  ('category-dresses', 'dresses', 'Dresses', 'Statement dresses for brunch, evening, and everything after.', '/assets/images/3920746353986469456.jpg', 3),
  ('category-resort-and-whites', 'resort-and-whites', 'Resort and Whites', 'Light layers, lasting impressions. Vacation-ready whites.', '/assets/images/3942701400028659556.jpg', 4),
  ('category-new-arrivals', 'new-arrivals', 'New Arrivals', 'The latest from our studio. Fresh drops, timeless appeal.', '/assets/images/3952741041305855070.jpg', 5)
on conflict (id) do update set name = excluded.name, description = excluded.description, image = excluded.image, sort_order = excluded.sort_order;

insert into collections (id, slug, name, description, image, hero_copy, sort_order)
values
  ('collection-short-kurtis', 'short-kurtis', 'Short Kurtis', 'Tradition, cut for today.', '/assets/images/3932554101906649932.jpg', 'Tradition, cut for today.', 0),
  ('collection-coord-sets', 'coord-sets', 'Co-ord Sets', 'One set. Endless moments.', '/assets/images/3895371692098630743.jpg', 'One set. Endless moments.', 1),
  ('collection-everyday-tops', 'everyday-tops', 'Everyday Tops', 'Easy elegance for daily wear.', '/assets/images/3923489547532341720.jpg', 'Effortless, every day.', 2),
  ('collection-dresses', 'dresses', 'Dresses', 'Statement dresses for every occasion.', '/assets/images/3920746353986469456.jpg', 'Dresses that speak for you.', 3),
  ('collection-resort-and-whites', 'resort-and-whites', 'Resort and Whites', 'Light layers, lasting impressions.', '/assets/images/3942701400028659556.jpg', 'Light layers, lasting impressions.', 4),
  ('collection-new-arrivals', 'new-arrivals', 'New Arrivals', 'Fresh from the studio.', '/assets/images/3952741041305855070.jpg', 'Fresh from the studio.', 5)
on conflict (id) do update set name = excluded.name, description = excluded.description, image = excluded.image, hero_copy = excluded.hero_copy, sort_order = excluded.sort_order;

insert into products (
  id, slug, name, category_id, category_slug, collection_id, collection_slug,
  price, currency, price_status, sizes, tags, availability, source_post_id,
  source_url, is_prototype_data, badge, active, featured
)
values
  ('p-kurti-01', 'chatpati-short-kurti', 'Chatpati Short Kurti', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Ethnic','Summer','Casual'], 'in-stock', '3936178179397803674', 'https://www.instagram.com/p/', true, 'featured', true, true),
  ('p-coord-01', 'floral-coord-set-white', 'Floral Co-ord Set - White and Black', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','White','Travel','Summer'], 'in-stock', '3911022349174249793', 'https://www.instagram.com/p/', true, 'featured', true, true),
  ('p-top-01', 'effortless-elegance-top', 'Effortless Elegance Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Minimal','Casual','Summer'], 'in-stock', '3945260404659568172', 'https://www.instagram.com/p/', true, 'new', true, false),
  ('p-dress-01', 'chocolate-brown-halter-dress', 'Chocolate Brown Halter Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Halter','Statement','Indo-Western'], 'in-stock', '3920746353986469456', 'https://www.instagram.com/p/', true, 'featured', true, true),
  ('p-resort-01', 'white-tiered-resort-dress', 'White Tiered Resort Dress', 'category-resort-and-whites', 'resort-and-whites', 'collection-resort-and-whites', 'resort-and-whites', 1690, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Travel','Summer','Minimal'], 'in-stock', '3942701400028659556', 'https://www.instagram.com/p/', true, 'featured', true, true),
  ('p-new-01', 'statement-corset-tunic', 'Statement Corset Tunic', 'category-new-arrivals', 'new-arrivals', 'collection-new-arrivals', 'new-arrivals', 1290, 'INR', 'demo', array['XS','S','M','L','XL'], array['Statement','Indo-Western','Summer'], 'in-stock', '3952741041305855070', 'https://www.instagram.com/p/', true, 'new', true, false)
on conflict (id) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  category_slug = excluded.category_slug,
  collection_id = excluded.collection_id,
  collection_slug = excluded.collection_slug,
  price = excluded.price,
  sizes = excluded.sizes,
  tags = excluded.tags,
  availability = excluded.availability,
  badge = excluded.badge,
  active = excluded.active,
  featured = excluded.featured;

insert into products (
  id, slug, name, category_id, category_slug, collection_id, collection_slug,
  price, currency, price_status, sizes, tags, availability, source_post_id,
  source_url, is_prototype_data, badge, active, featured
)
values
  ('p-kurti-02', 'cotton-everyday-kurti', 'Cotton Everyday Kurti', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Ethnic','Casual','Minimal'], 'in-stock', '3939802292590768865', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-kurti-03', 'premium-cotton-kurti-purple', 'Premium Cotton Kurti - Purple', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Ethnic','Indo-Western','Summer'], 'in-stock', '3932554101906649932', 'https://www.instagram.com/p/', true, 'new', true, false),
  ('p-kurti-04', 'summer-edit-kurti', 'Summer Edit Kurti', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Summer','Ethnic'], 'in-stock', '3918403316976935650', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-kurti-05', 'purple-floral-short-kurti', 'Purple Floral Short Kurti', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Ethnic','Summer','Statement'], 'in-stock', '3931104797681236517', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-kurti-06', 'fusion-short-kurti-drop', 'Fusion Short Kurti Drop', 'category-short-kurtis', 'short-kurtis', 'collection-short-kurtis', 'short-kurtis', 890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Indo-Western','Casual','Ethnic'], 'in-stock', '3937627844097571363', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-coord-02', 'sheer-overlay-floral-set', 'Sheer Overlay Floral Set', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Banaras-inspired','Summer','Statement'], 'in-stock', '3897412631952592325', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-coord-03', 'banaras-embroidered-set', 'Banaras Embroidered Co-ord Set', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Banaras-inspired','Summer','Ethnic'], 'in-stock', '3895371692098630743', 'https://www.instagram.com/p/', true, 'new', true, false),
  ('p-coord-04', 'whisper-elegance-cord-set', 'Whisper Elegance Cord Set', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Banaras-inspired','Minimal','Summer'], 'in-stock', '3900319569828324606', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-coord-05', 'paisley-coord-set', 'Paisley Co-ord Set', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['Paisley','Summer','Travel','Statement'], 'in-stock', '3894492185875542527', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-coord-06', 'summer-whites-coord-set', 'Summer Whites Co-ord Set', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Floral','Summer','Minimal'], 'low-stock', '3895375655824473281', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-coord-07', 'white-floral-summer-coord', 'White Floral Summer Co-ord', 'category-coord-sets', 'coord-sets', 'collection-coord-sets', 'coord-sets', 1890, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Floral','Summer','Minimal'], 'in-stock', '3895369217693688298', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-02', 'blue-aesthetic-top', 'Blue Aesthetic Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Casual','Summer','Minimal'], 'in-stock', '3948711001626445713', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-03', 'soft-hues-top', 'Soft Hues Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Minimal','Casual','Summer'], 'in-stock', '3945249942773160313', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-04', 'everyday-elegance-top', 'Everyday Elegance Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Casual','Summer','Minimal'], 'in-stock', '3947985919258649252', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-05', 'twist-front-floral-top', 'Twist-Front Floral Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Casual','Summer'], 'in-stock', '3923489547532341720', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-06', 'white-halter-top', 'White Halter Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Halter','Minimal','Summer'], 'in-stock', '3923512320514713148', 'https://www.instagram.com/p/', true, 'featured', true, true),
  ('p-top-07', 'floral-halter-top', 'Floral Halter Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Halter','White','Summer'], 'in-stock', '3923476630602737800', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-top-08', 'asymmetrical-cami-top', 'Asymmetrical Cami Top', 'category-everyday-tops', 'everyday-tops', 'collection-everyday-tops', 'everyday-tops', 790, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Casual','Summer','Statement'], 'in-stock', '3913335584870887646', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-dress-02', 'statement-evening-dress', 'Statement Evening Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Statement','Indo-Western','Summer'], 'in-stock', '3929655482518054688', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-dress-03', 'indowestern-maxi-dress', 'Indo-Western Maxi Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Indo-Western','Summer','Statement'], 'in-stock', '3930379962365755965', 'https://www.instagram.com/p/', true, 'new', true, false),
  ('p-dress-04', 'cream-maxi-dress', 'Cream Maxi Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Minimal','Summer','Casual'], 'in-stock', '3928572692891905122', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-dress-05', 'elegant-halter-dress', 'Elegant Halter Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Halter','Statement','Summer'], 'in-stock', '3920761862438556080', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-dress-06', 'summer-ready-dress', 'Summer Ready Dress', 'category-dresses', 'dresses', 'collection-dresses', 'dresses', 1490, 'INR', 'demo', array['XS','S','M','L','XL'], array['Floral','Summer','Casual'], 'in-stock', '3920737631633963676', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-resort-02', 'smocked-white-dress', 'Smocked White Dress', 'category-resort-and-whites', 'resort-and-whites', 'collection-resort-and-whites', 'resort-and-whites', 1690, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Minimal','Summer'], 'in-stock', '3944875503212557962', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-resort-03', 'white-embroidered-dress', 'White Embroidered Dress', 'category-resort-and-whites', 'resort-and-whites', 'collection-resort-and-whites', 'resort-and-whites', 1690, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Floral','Summer','Minimal'], 'in-stock', '3941251484517112834', 'https://www.instagram.com/p/', true, null, true, false),
  ('p-resort-04', 'breezy-white-look', 'Breezy White Look', 'category-resort-and-whites', 'resort-and-whites', 'collection-resort-and-whites', 'resort-and-whites', 1690, 'INR', 'demo', array['XS','S','M','L','XL'], array['White','Minimal','Summer','Travel'], 'in-stock', '3909860176766659847', 'https://www.instagram.com/p/', true, null, true, false)
on conflict (id) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  category_slug = excluded.category_slug,
  collection_id = excluded.collection_id,
  collection_slug = excluded.collection_slug,
  price = excluded.price,
  sizes = excluded.sizes,
  tags = excluded.tags,
  availability = excluded.availability,
  source_post_id = excluded.source_post_id,
  badge = excluded.badge,
  active = excluded.active,
  featured = excluded.featured;

insert into product_images (id, product_id, url, alt_text, sort_order, is_primary)
values
  ('p-kurti-01-image-1', 'p-kurti-01', '/assets/images/3936178179397803674.jpg', 'Chatpati Short Kurti', 0, true),
  ('p-coord-01-image-1', 'p-coord-01', '/assets/images/3911022349174249793.jpg', 'Floral Co-ord Set', 0, true),
  ('p-top-01-image-1', 'p-top-01', '/assets/images/3945260404659568172.jpg', 'Effortless Elegance Top', 0, true),
  ('p-dress-01-image-1', 'p-dress-01', '/assets/images/3920746353986469456.jpg', 'Chocolate Brown Halter Dress', 0, true),
  ('p-resort-01-image-1', 'p-resort-01', '/assets/images/3942701400028659556.jpg', 'White Tiered Resort Dress', 0, true),
  ('p-new-01-image-1', 'p-new-01', '/assets/images/3952741041305855070.jpg', 'Statement Corset Tunic', 0, true)
on conflict (id) do update set url = excluded.url, alt_text = excluded.alt_text, sort_order = excluded.sort_order, is_primary = excluded.is_primary;

insert into product_images (id, product_id, url, alt_text, sort_order, is_primary)
values
  ('p-kurti-02-image-1', 'p-kurti-02', '/assets/images/3939802292590768865.jpg', 'Cotton Everyday Kurti', 0, true),
  ('p-kurti-03-image-1', 'p-kurti-03', '/assets/images/3932554101906649932.jpg', 'Premium Cotton Kurti Purple', 0, true),
  ('p-kurti-04-image-1', 'p-kurti-04', '/assets/images/3918403316976935650.jpg', 'Summer Edit Kurti', 0, true),
  ('p-kurti-05-image-1', 'p-kurti-05', '/assets/images/3931104797681236517.jpg', 'Purple Floral Short Kurti', 0, true),
  ('p-kurti-06-image-1', 'p-kurti-06', '/assets/images/3937627844097571363.jpg', 'Fusion Short Kurti Drop', 0, true),
  ('p-coord-02-image-1', 'p-coord-02', '/assets/images/3897412631952592325.jpg', 'Sheer Overlay Floral Set', 0, true),
  ('p-coord-03-image-1', 'p-coord-03', '/assets/images/3895371692098630743.jpg', 'Banaras Embroidered Co-ord Set', 0, true),
  ('p-coord-04-image-1', 'p-coord-04', '/assets/images/3900319569828324606.jpg', 'Whisper Elegance Cord Set', 0, true),
  ('p-coord-05-image-1', 'p-coord-05', '/assets/images/3894492185875542527.jpg', 'Paisley Co-ord Set', 0, true),
  ('p-coord-06-image-1', 'p-coord-06', '/assets/images/3895375655824473281.jpg', 'Summer Whites Co-ord Set', 0, true),
  ('p-coord-07-image-1', 'p-coord-07', '/assets/images/3895369217693688298.jpg', 'White Floral Summer Co-ord', 0, true),
  ('p-top-02-image-1', 'p-top-02', '/assets/images/3948711001626445713.jpg', 'Blue Aesthetic Top', 0, true),
  ('p-top-03-image-1', 'p-top-03', '/assets/images/3945249942773160313.jpg', 'Soft Hues Top', 0, true),
  ('p-top-04-image-1', 'p-top-04', '/assets/images/3947985919258649252.jpg', 'Everyday Elegance Top', 0, true),
  ('p-top-05-image-1', 'p-top-05', '/assets/images/3923489547532341720.jpg', 'Twist-Front Floral Top', 0, true),
  ('p-top-06-image-1', 'p-top-06', '/assets/images/3923512320514713148.jpg', 'White Halter Top', 0, true),
  ('p-top-07-image-1', 'p-top-07', '/assets/images/3923476630602737800.jpg', 'Floral Halter Top', 0, true),
  ('p-top-08-image-1', 'p-top-08', '/assets/images/3913335584870887646.jpg', 'Asymmetrical Cami Top', 0, true),
  ('p-dress-02-image-1', 'p-dress-02', '/assets/images/3929655482518054688.jpg', 'Statement Evening Dress', 0, true),
  ('p-dress-03-image-1', 'p-dress-03', '/assets/images/3930379962365755965.jpg', 'Indo-Western Maxi Dress', 0, true),
  ('p-dress-04-image-1', 'p-dress-04', '/assets/images/3928572692891905122.jpg', 'Cream Maxi Dress', 0, true),
  ('p-dress-05-image-1', 'p-dress-05', '/assets/images/3920761862438556080.jpg', 'Elegant Halter Dress', 0, true),
  ('p-dress-06-image-1', 'p-dress-06', '/assets/images/3920737631633963676.jpg', 'Summer Ready Dress', 0, true),
  ('p-resort-02-image-1', 'p-resort-02', '/assets/images/3944875503212557962.jpg', 'Smocked White Dress', 0, true),
  ('p-resort-03-image-1', 'p-resort-03', '/assets/images/3941251484517112834.jpg', 'White Embroidered Dress', 0, true),
  ('p-resort-04-image-1', 'p-resort-04', '/assets/images/3909860176766659847.jpg', 'Breezy White Look', 0, true)
on conflict (id) do update set url = excluded.url, alt_text = excluded.alt_text, sort_order = excluded.sort_order, is_primary = excluded.is_primary;

update products as product
set description = seed.description,
    video = seed.video
from (values
  ('p-kurti-01', 'A playful short kurti with a vibrant floral print and a tailored fit. Crafted from breathable cotton for all-day comfort. Designed to pair effortlessly with jeans or palazzos.', '/assets/videos/3936178179397803674.mp4'),
  ('p-kurti-02', 'Premium cotton kurti that holds its colour and shape wash after wash. A versatile piece for daily wear with a clean, modern silhouette.', '/assets/videos/3939802292590768865.mp4'),
  ('p-kurti-03', 'A rich purple kurti in premium cotton with an elegant wrap-around silhouette. Combines ethnic charm with everyday ease.', '/assets/videos/3932554101906649932.mp4'),
  ('p-kurti-04', 'Part of our summer edit featuring 15 elegant designs. A breezy kurti crafted for comfort, style, and everyday versatility.', null),
  ('p-kurti-05', 'A vibrant pop of colour for your everyday wardrobe. This purple floral kurti features a gorgeous fit and intricate detailing.', null),
  ('p-kurti-06', 'One wardrobe, endless moods. This short kurti drop features fusion styling that transitions from day to night effortlessly.', null),
  ('p-coord-01', 'A crisp white and black floral co-ord set that is super soft and breathable. Perfect for travel and everyday wear with an effortless drape.', '/assets/videos/3911022349174249793.mp4'),
  ('p-coord-02', 'A floral sheer overlay set that transitions from casual to Khadeeja Empire elegance. Handcrafted details meet effortless summer styling.', '/assets/videos/3897412631952592325.mp4'),
  ('p-coord-03', 'From the streets of Banaras to your summer mood board. This floral embroidered set is the ultimate OOTD for those who love colour and craft.', '/assets/videos/3895371692098630743.mp4'),
  ('p-coord-04', 'A cord set that whispers elegance with every step. Crafted in Banaras with breathable fabric and a fluid drape.', '/assets/videos/3900299515141596522.mp4'),
  ('p-coord-05', 'Step into the sunshine with our latest paisley obsession. This co-ord set blends intricate lace details with vibrant prints for the perfect summer look.', '/assets/videos/3894492185875542527.mp4'),
  ('p-coord-06', 'Sun-kissed and styled in our favourite summer whites. This floral embroidered co-ord set is all about comfort without compromise.', null),
  ('p-coord-07', 'Summer whites done right. A clean co-ord set with floral embroidery that feels like a breath of fresh air. Casual, comfortable, and effortlessly chic.', null),
  ('p-top-01', 'Elegance that speaks before you do. A timeless top designed for effortless style and all-day comfort.', '/assets/videos/3945260404659568172.mp4'),
  ('p-top-02', 'Your next favourite top. A soft blue piece that pairs beautifully with jeans or a skirt for a versatile everyday look.', null),
  ('p-top-03', 'Soft hues, effortless charm, endless compliments. Your new favourite top is here with a beautifully relaxed fit.', null),
  ('p-top-04', 'The top that makes every outfit look effortless. Comfort meets elegance in our newest arrival with a clean, versatile design.', '/assets/videos/3947985919258649252.mp4'),
  ('p-top-05', 'Your go-to casual favourite. Breathable fabric, a timeless floral print, and a perfectly tailored twist-front design.', null),
  ('p-top-06', 'A crisp white halter top that is minimal, beautifully structured, and gives that effortless look without trying too hard.', '/assets/videos/3923512320514713148.mp4'),
  ('p-top-07', 'Sweet florals and effortless summer silhouettes. Keep it cool and classic with this white halter-style top with delicate floral detailing.', null),
  ('p-top-08', 'Brunch date or a casual day out - this top is ready for both. A subtle floral print with an asymmetrical flare on this cami top.', null),
  ('p-dress-01', 'From basic lounge layers to the ultimate confidence boost. A deep chocolate brown halter dress with an effortless flow and stunning drape.', '/assets/videos/3920746353986469456.mp4'),
  ('p-dress-02', 'When the outfit looks this good, being late is worth it. A statement dress that makes getting ready a breeze for brunch or an evening out.', '/assets/videos/3929655482518054688.mp4'),
  ('p-dress-03', 'Getting ready for a brunch or an evening out is a breeze when you have a statement piece like this. An Indo-Western maxi with a flawless silhouette.', null),
  ('p-dress-04', 'When comfort meets high fashion, you get this stunning cream maxi. The lightweight fabric keeps you cool while the silhouette turns heads.', null),
  ('p-dress-05', 'It is all in the details - from the delicate halter tie to the flawless drape. Stepping out in pure elegance with a dress that speaks for itself.', null),
  ('p-dress-06', 'Consider the outfit of the day sorted. A beautiful print and elegant silhouette make this summer-ready piece a wardrobe essential.', null),
  ('p-resort-01', 'Packing for your next getaway? Make sure this is the first thing in your suitcase. A dreamy, tiered white dress that says vacation mode.', '/assets/videos/3942701400028659556.mp4'),
  ('p-resort-02', 'Minimal effort, maximum elegance. For the days when you want to look instantly put-together without trying too hard. A beautifully smocked white dress.', null),
  ('p-resort-03', 'The ultimate white dress your wardrobe has been missing. Designed with breathable fabric, a flattering plunge neckline, and intricate embroidery details.', null),
  ('p-resort-04', 'Light, breezy, effortless. Embrace comfort with style in this relaxed white piece designed for sun-soaked days.', null),
  ('p-new-01', 'Serving looks you cannot ignore. This statement corset tunic is giving all the right vibes - perfect for turning heads.', '/assets/videos/3952741041305855070.mp4')
) as seed(id, description, video) where product.id = seed.id;

insert into hero_slides (id, title, subtitle, image, image_alt, video, cta, cta_link, collection_slug, sort_order)
values
  ('hero-1', 'ETHNIC WEAR', 'Everyday Elegance', '/assets/slides/girl-1.png', 'Woman wearing a black and white tunic.', '/assets/videos/3932554101906649932.mp4', 'Explore', '/collections/short-kurtis', 'short-kurtis', 0),
  ('hero-2', 'MODERN STYLES', 'Casual Comfort', '/assets/slides/girl-2.png', 'Woman wearing a light blue co-ord set.', '/assets/videos/3895371692098630743.mp4', 'Explore', '/collections/coord-sets', 'coord-sets', 1),
  ('hero-3', 'WOMEN''S FASHION', 'Timeless Traditions', '/assets/slides/girl-3.png', 'Woman wearing a pale blue top with black trousers.', '/assets/videos/3942701400028659556.mp4', 'Explore', '/collections/resort-and-whites', 'resort-and-whites', 2)
on conflict (id) do update set title = excluded.title, subtitle = excluded.subtitle, image = excluded.image, image_alt = excluded.image_alt, video = excluded.video, cta = excluded.cta, cta_link = excluded.cta_link, collection_slug = excluded.collection_slug, sort_order = excluded.sort_order;

insert into instagram_posts (id, caption, hashtags, source_url, type, image, video, timestamp, sort_order)
values
  ('3942701400028659556', 'Packing for your next getaway? Make sure this is the first thing in your suitcase.', array['KhadeejaEmpire','VacationOOTD','ResortWear','TravelStyle'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3942701400028659556.jpg', '/assets/videos/3942701400028659556.mp4', '2026-07-20', 0),
  ('3897412631952592325', 'The Luxury Transition. From casual to Khadeeja Empire elegance.', array['khadeejaempire','banaras','fashion','coordset'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3897412631952592325.jpg', '/assets/videos/3897412631952592325.mp4', '2026-06-10', 1),
  ('3895371692098630743', 'The Vibe. From the streets of Banaras to your summer mood board.', array['khadeejaempire','ootd','summerstyle','banarasifashion'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3895371692098630743.jpg', '/assets/videos/3895371692098630743.mp4', '2026-06-05', 2),
  ('3952741041305855070', 'Serving looks you cannot ignore. This statement corset tunic is giving all the right vibes.', array['khadeejaempire','fashionista','newcollection'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3952741041305855070.jpg', '/assets/videos/3952741041305855070.mp4', '2026-07-25', 3)
on conflict (id) do update set caption = excluded.caption, hashtags = excluded.hashtags, source_url = excluded.source_url, type = excluded.type, image = excluded.image, video = excluded.video, timestamp = excluded.timestamp, sort_order = excluded.sort_order;

insert into instagram_posts (id, caption, hashtags, source_url, type, image, video, timestamp, sort_order)
values
  ('3911022349174249793', 'Mountain breeze and the perfect outfit to match. Absolutely loving this white and black floral co-ord set from Khadeeja Empire. Super soft, breathable, and effortlessly stylish.', array['KhadeejaEmpire','CoOrdSet','FloralVibes','TravelOOTD','EffortlessStyle'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3911022349174249793.jpg', '/assets/videos/3911022349174249793.mp4', '2026-06-25', 4),
  ('3920746353986469456', 'From basic lounge layers to the ultimate confidence boost. Absolutely obsessed with the deep chocolate brown tone and effortless flow of this halter dress.', array['KhadeejaEmpire','OutfitTransition','GlowUpReel','BrownDress','HalterDress'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3920746353986469456.jpg', '/assets/videos/3920746353986469456.mp4', '2026-07-05', 5),
  ('3945260404659568172', 'Elegance that speaks before you do. A timeless top designed for effortless style and all-day comfort.', array['Khadeeja','KhadeejaEmpire','WomenFashion','EverydayStyle','FashionReel'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3945260404659568172.jpg', '/assets/videos/3945260404659568172.mp4', '2026-07-22', 6),
  ('3932554101906649932', 'Premium quality should not come with a premium price tag. If you are tired of kurtis that shrink after one wash or lose their colour in the sun, it is time to upgrade.', array['KhadeejaEmpire','ShortKurti','AffordableFashion','CottonKurtis','EthnicWear'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3932554101906649932.jpg', '/assets/videos/3932554101906649932.mp4', '2026-07-15', 7),
  ('3923512320514713148', 'Absolutely in love with this crisp white halter top from Khadeeja Empire. Minimal, beautifully structured, and gives that effortless look without trying too hard.', array['KhadeejaEmpire','OutfitCheck','TransitionReel','Whitetop','summerstyles'], 'https://www.instagram.com/khadeejaempire/', 'Video', '/assets/images/3923512320514713148.jpg', '/assets/videos/3923512320514713148.mp4', '2026-07-08', 8),
  ('3923476630602737800', 'Sweet florals and effortless summer silhouettes. Keep it cool and classic with this white halter-style top from Khadeeja Empire.', array['KhadeejaEmpire','FloralTop','SummerStyle','OOTDInspiration','effortlesschic'], 'https://www.instagram.com/khadeejaempire/', 'Sidecar', '/assets/images/3923476630602737800.jpg', null, '2026-07-08', 9),
  ('3944875503212557962', 'Minimal effort, maximum elegance. For the days when you want to look instantly put-together without trying too hard. The beautifully smocked waist white dress.', array['CleanGirlAesthetic','MinimalistFashion','AllWhiteEverything','SummerEssentials','ClassyOutfits'], 'https://www.instagram.com/khadeejaempire/', 'Sidecar', '/assets/images/3944875503212557962.jpg', null, '2026-07-21', 10),
  ('3912472252555175961', 'Keeping it classic, elegant, and incredibly comfortable. This gorgeous floral co-ord set from Khadeeja Empire is a total summer and travel essential.', array['KhadeejaEmpire','TravelStyle','SummerOutfits','CoOrdSets','FloralPrint'], 'https://www.instagram.com/khadeejaempire/', 'Sidecar', '/assets/images/3912472252555175961.jpg', null, '2026-06-28', 11)
on conflict (id) do update set caption = excluded.caption, hashtags = excluded.hashtags, source_url = excluded.source_url, type = excluded.type, image = excluded.image, video = excluded.video, timestamp = excluded.timestamp, sort_order = excluded.sort_order;

insert into announcements (id, text, sort_order)
values
  ('announcement-1', 'PAN INDIA SHIPPING IN 20 WORKING DAYS', 0),
  ('announcement-2', 'COMPLIMENTARY SHIPPING ON ORDERS ABOVE INR 2,000', 1),
  ('announcement-3', 'HANDCRAFTED IN BANARAS - MADE TO ORDER', 2)
on conflict (id) do update set text = excluded.text, sort_order = excluded.sort_order;

insert into settings (id, key, value, description)
values
  ('setting-site-name', 'site.name', to_jsonb('Khadeeja Empire'::text), 'Public brand name'),
  ('setting-site-tagline', 'site.tagline', to_jsonb('Modern Indian Womenswear'::text), 'Public brand tagline'),
  ('setting-site-logo', 'site.logo', to_jsonb('/assets/logo.png'::text), 'Public logo path'),
  ('setting-site-email', 'site.email', to_jsonb('hello@khadeejaempire.com'::text), 'Public contact email'),
  ('setting-shipping-threshold', 'shipping.freeThreshold', to_jsonb(2000), 'Free shipping threshold in INR'),
  ('setting-shipping-default', 'shipping.defaultRate', to_jsonb(99), 'Default shipping amount in INR'),
  ('setting-shipping-cod', 'shipping.codAvailable', to_jsonb(true), 'Whether cash on delivery is available')
on conflict (key) do update set value = excluded.value, description = excluded.description;

insert into shipping_rates (id, name, amount, free_above, cod_available, active)
values ('shipping-standard', 'Standard shipping', 99, 2000, true, true)
on conflict (id) do update set name = excluded.name, amount = excluded.amount, free_above = excluded.free_above, cod_available = excluded.cod_available, active = excluded.active;

insert into promo_settings (id, enabled, frequency, max_views)
values ('promo-home', false, 'session', 1)
on conflict (id) do update set enabled = excluded.enabled, frequency = excluded.frequency, max_views = excluded.max_views;

-- profiles, customers, addresses, orders, order_items, reviews, inquiries, subscribers,
-- colors, variants, product_information, testimonials, faqs, coupons, and discovery
-- menu entries intentionally start empty until admin data is entered.
