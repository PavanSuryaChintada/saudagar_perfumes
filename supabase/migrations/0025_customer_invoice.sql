-- 0025_customer_invoice: customers can open the GST invoice for their own orders, so the seller details printed
-- on every invoice (legal name, GSTIN, address, state, small print) become readable by the storefront.
update public.settings set is_public = true
where key in ('business.legal_name', 'business.gstin', 'business.address', 'business.state', 'business.invoice_note');
