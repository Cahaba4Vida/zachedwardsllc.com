alter table project_quotes drop constraint if exists project_quotes_kind_check;
alter table project_quotes add constraint project_quotes_kind_check check (kind in ('website','app','software'));

alter table client_projects drop constraint if exists client_projects_kind_check;
alter table client_projects add constraint client_projects_kind_check check (kind in ('website','app','software'));
