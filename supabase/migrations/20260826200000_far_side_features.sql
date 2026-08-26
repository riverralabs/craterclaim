-- Named far-side premium destinations. Near-side V1 sites stay as-is.

insert into public.lunar_features (id, name, type, center_lat, center_lng, radius_deg, is_premium)
values
  ('orientale', 'Mare Orientale', 'mare', -19.4, -92.8, 10, true),
  ('moscoviense', 'Mare Moscoviense', 'mare', 27.3, 147.9, 9, true),
  ('tsiolkovskiy', 'Tsiolkovskiy', 'crater', -20.4, 129.1, 8, true),
  ('hertzsprung', 'Hertzsprung', 'crater', 1.4, -128.7, 11, true),
  ('ingenii', 'Mare Ingenii', 'mare', -33.7, 163.5, 8, true),
  ('korolev', 'Korolev', 'crater', -4.0, -157.4, 10, true)
on conflict (id) do update
set
  name = excluded.name,
  type = excluded.type,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  radius_deg = excluded.radius_deg,
  is_premium = excluded.is_premium;
