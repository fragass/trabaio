
create table profiles (
  id uuid primary key references auth.users(id),
  username text unique,
  created_at timestamp default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text,
  user_id uuid references profiles(id),
  created_at timestamp default now()
);

create table replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id),
  content text,
  user_id uuid references profiles(id),
  created_at timestamp default now()
);
