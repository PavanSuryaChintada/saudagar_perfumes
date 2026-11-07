-- 0007 The owner removed WhatsApp automation (2026-11-07). Only the click-to-chat number stays.
delete from public.settings where key = 'whatsapp.enabled';
