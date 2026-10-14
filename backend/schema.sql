CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE,
    time TIME,
    venue TEXT,
    description TEXT,
    image_url TEXT DEFAULT '',
    created_by INTEGER REFERENCES users(id),
    visibility TEXT DEFAULT 'public'
);

CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    time_stamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checkin_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    checked_in_at TIMESTAMPTZ
);
