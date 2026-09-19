CREATE TABLE IF NOT EXISTS public.campaign_revenue_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    linktree_id uuid NOT NULL,
    advertisement_price_iqd bigint NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    campaign_spend_usd numeric(14,2) NOT NULL,
    usd_to_iqd_rate numeric(12,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaign_revenue_records_pkey PRIMARY KEY (id),
    CONSTRAINT chk_campaign_revenue_advertisement_price CHECK (advertisement_price_iqd > 0),
    CONSTRAINT chk_campaign_revenue_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_campaign_revenue_spend CHECK (campaign_spend_usd >= 0),
    CONSTRAINT chk_campaign_revenue_exchange_rate CHECK (usd_to_iqd_rate > 0),
    CONSTRAINT fk_campaign_revenue_business FOREIGN KEY (business_id)
        REFERENCES public.businesses(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_revenue_linktree_owner FOREIGN KEY (linktree_id, business_id)
        REFERENCES public.linktrees(id, business_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_revenue_linktree_dates
    ON public.campaign_revenue_records (business_id, linktree_id, start_date DESC, created_at DESC);

DROP TRIGGER IF EXISTS trg_campaign_revenue_records_updated_at ON public.campaign_revenue_records;
CREATE TRIGGER trg_campaign_revenue_records_updated_at
    BEFORE UPDATE ON public.campaign_revenue_records
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
