
create table profiles (
  id uuid primary key references auth.users(id),
  username text unique,
  avatar_url text,
  created_at timestamp default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamp default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text,
  category_id uuid references categories(id),
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
