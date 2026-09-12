-- Migration date: 2026-09-12
--
-- Retarget the member profile from legal professionals to construction members.
--
-- Upstream Mike profiles a lawyer: practice_setting is private practice /
-- in-house / not practising, professional_title is Partner / Senior Associate /
-- Law Clerk, and practice_areas are legal practice areas. BIG members are
-- general contractors, subcontractors, crews, owners and vendors. Asking them
-- which chambers they work in is meaningless, and the CHECK constraints made
-- it impossible to answer honestly.
--
-- Column names are deliberately unchanged. They are internal identifiers, and
-- renaming them would churn every read site and every upstream sync for no
-- member-visible gain. Only the permitted VALUES change.
--
-- Existing rows: any value from the legal vocabulary no longer validates, so it
-- is set to null rather than guessed at. A member re-answers in plain language
-- the next time they open Settings. Null was already permitted, so this cannot
-- break a read path.

begin;

-- --- practice_setting: what kind of outfit the member works in --------------
alter table public.user_profiles
  drop constraint if exists user_profiles_practice_setting_check;

update public.user_profiles
   set practice_setting = null
 where practice_setting is not null
   and practice_setting not in (
     'general_contractor',
     'subcontractor',
     'independent',
     'owner_developer',
     'vendor_supplier',
     'other'
   );

alter table public.user_profiles
  add constraint user_profiles_practice_setting_check
  check (
    practice_setting is null
    or practice_setting in (
      'general_contractor',
      'subcontractor',
      'independent',
      'owner_developer',
      'vendor_supplier',
      'other'
    )
  );

-- --- professional_title: the member's role in that outfit -------------------
alter table public.user_profiles
  drop constraint if exists user_profiles_professional_title_check;

update public.user_profiles
   set professional_title = null
 where professional_title is not null
   and professional_title not in (
     'Owner',
     'Project Manager',
     'Site Supervisor',
     'Foreman',
     'Estimator',
     'Office Manager',
     'Tradesperson',
     'Other'
   );

alter table public.user_profiles
  add constraint user_profiles_professional_title_check
  check (
    professional_title is null
    or professional_title in (
      'Owner',
      'Project Manager',
      'Site Supervisor',
      'Foreman',
      'Estimator',
      'Office Manager',
      'Tradesperson',
      'Other'
    )
  );

-- --- practice_areas: the trades the member works in -------------------------
-- Never CHECK-constrained (it is a text[]), so only the stored values are
-- cleared. The frontend supplies the new list; anything unrecognised is
-- dropped rather than shown back to a member as a legal practice area.
update public.user_profiles
   set practice_areas = '{}'::text[]
 where practice_areas <> '{}'::text[]
   and not (practice_areas <@ array[
     'General Construction',
     'Carpentry',
     'Electrical',
     'Plumbing',
     'HVAC',
     'Roofing',
     'Concrete and Masonry',
     'Drywall and Painting',
     'Flooring',
     'Landscaping',
     'Remodeling',
     'Demolition',
     'Other'
   ]::text[]);

commit;
