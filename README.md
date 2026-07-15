# RVSPly

RVSPly is a Full Stack RSVP and Event Management System developed as a college project.

## Features

- User Registration and Login
- Event Creation and Management
- RSVP Tracking
- Guest List Management
- QR Code Generation
- CSV and Excel Export Support

---

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Flask
- PostgreSQL
- Pandas
- Psycopg2
- Flask-CORS
- QRCode
- Bcrypt

---

## Project Structure

```
RVSPly/

├── backend/
│   ├── venv/
│   ├── app.py
│   └── requirements.txt
│
├── frontend/
│   ├── html/
│   ├── images/
│   ├── script/
│   └── style/
│
├── README.md
└── .gitignore
```

---

## Setup

### Clone the Repository

```
git clone <repository_link>
```

### Create and Activate Virtual Environment

```
cd backend

python -m venv venv
venv\Scripts\activate
```

### Install Dependencies

```
pip install -r requirements.txt
```

### Run the Backend

```
python app.py
```

The Flask backend runs on:

```
http://127.0.0.1:5000
```

### Run the Frontend

Open:

```
frontend/html/index.html
```

using VS Code Live Server.

---

## PostgreSQL

Make sure PostgreSQL is installed and running.

Create the database:

```
CREATE DATABASE rvsply_db;
```

---

## Contributors

- Amaan Shaikh
- Tejas Bafna
- Ishwarsingh Rao