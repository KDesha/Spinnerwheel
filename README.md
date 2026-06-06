# Book Club Spin Wheel

A simple pastel book-club spin wheel that lets everyone add book ideas, spin for the next read, and move finished picks into a “Books Read” list.

This version is designed to be hosted on GitHub Pages and connected to Supabase for the shared online book list.

## Features

- Mobile-friendly spin wheel
- Pretty pastel design
- Add unlimited book titles
- Saves each person’s name on their own device
- Randomly picks a book from the wheel
- Move selected books to “Books Read”
- Shared online book list with Supabase
- No server or computer left running

## Files

For GitHub Pages, your main HTML file should be named:

```text
index.html
```

If your file is currently named something like:

```text
book-club-spin-wheel-supabase.html
```

rename it to:

```text
index.html
```

## Supabase setup

Create a free Supabase project, then go to **SQL Editor** and run this:

```sql
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  added_by text,
  status text not null default 'active',
  finished_by text,
  created_at timestamptz default now(),
  finished_at timestamptz
);

alter table public.books enable row level security;

create policy "Allow public read books"
on public.books
for select
using (true);

create policy "Allow public insert books"
on public.books
for insert
with check (true);

create policy "Allow public update books"
on public.books
for update
using (true)
with check (true);

create policy "Allow public delete books"
on public.books
for delete
using (true);
```

Then go to **Project Settings → API** and copy:

- Project URL
- anon public key

Paste them into the HTML file here:

```js
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE";
```

## Add project to GitHub

Open Terminal and run:

```bash
cd /Users/kayladeshasier/Desktop/BakerCollege/Programming/Spinnerwheel
```

Make sure your HTML file is named `index.html`.

Then run:

```bash
git init
git add .
git commit -m "Initial book club spin wheel"
git branch -M main
```

Create a new empty repository on GitHub. Do not initialize it with a README because this project already has one.

Then connect your local folder to GitHub:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual GitHub username and repository name.

## Turn on GitHub Pages

In GitHub:

1. Open the repository.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select:
   - Branch: `main`
   - Folder: `/root`
6. Click **Save**.

After a minute or two, GitHub will give you a public website link.

## Updating the site later

After changing the HTML file, run:

```bash
cd /Users/kayladeshasier/Desktop/BakerCollege/Programming/Spinnerwheel
git add .
git commit -m "Update spin wheel"
git push
```

GitHub Pages will redeploy the site automatically.

## Important note

This project is meant for a trusted book club group. The simple Supabase policies allow anyone with the website link to add, update, or delete books.
