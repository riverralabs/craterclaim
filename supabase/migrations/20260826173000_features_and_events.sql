-- Seed named premium regions and keep plot_events readable by service role.

insert into public.lunar_features (id, name, type, center_lat, center_lng, radius_deg, is_premium)
values
  ('tranquillitatis', 'Mare Tranquillitatis', 'mare', 8.5, 31.4, 16, true),
  ('imbrium', 'Mare Imbrium', 'mare', 32.8, -15.6, 18, true),
  ('serenitatis', 'Mare Serenitatis', 'mare', 28.0, 17.5, 12, true),
  ('procellarum', 'Oceanus Procellarum', 'oceanus', 18.4, -57.4, 22, true),
  ('tycho', 'Tycho', 'crater', -43.3, -11.2, 7, true),
  ('copernicus', 'Copernicus', 'crater', 9.62, -20.08, 7, true),
  ('aristarchus', 'Aristarchus', 'crater', 23.7, -47.4, 6, true),
  ('south-pole', 'South Pole', 'pole', -89.5, 0, 10, true)
on conflict (id) do nothing;
