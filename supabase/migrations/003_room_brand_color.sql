-- Add brand color column to rooms.
-- Stores the customer's primary brand color (hex, e.g. '#FF5733').
-- Used to theme the prospect-facing room with the customer's brand.

alter table rooms add column brand_primary_color text;
