-- 0030_product_defaults: the label details that are the same for every product (manufacturer, packer, importer,
-- consumer care, shelf life…). New products start with them, and the product page uses them wherever a product
-- leaves a field empty. Public because they are printed on every product page.
insert into public.settings (key, value, is_public, description) values
  ('product_defaults.country_of_origin', '"India"', true, 'Country of origin on every product page'),
  ('product_defaults.manufacturer_name', '""', true, 'Manufacturer name'),
  ('product_defaults.manufacturer_address', '""', true, 'Manufacturer address'),
  ('product_defaults.packer_name', '""', true, 'Packer name'),
  ('product_defaults.packer_address', '""', true, 'Packer address'),
  ('product_defaults.importer_name', '""', true, 'Importer name (only if imported)'),
  ('product_defaults.importer_address', '""', true, 'Importer address'),
  ('product_defaults.consumer_care', '""', true, 'Consumer care phone / email / address'),
  ('product_defaults.shelf_life', '""', true, 'Best before / shelf life'),
  ('product_defaults.caution_text', '"For external use only. Flammable: keep away from heat and open flame."', true, 'Caution text'),
  ('product_defaults.hsn_code', '"3303"', true, 'HSN code for new products'),
  ('product_defaults.gst_rate', '18', true, 'GST rate (%) for new products')
on conflict (key) do nothing;
