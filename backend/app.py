from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt, pandas as pd
from io import BytesIO
import qrcode, base64

app = Flask(__name__)
CORS(app)

# ==========================================================
# DATABASE CONNECTION
# ==========================================================
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="rvsply_db",
        user="postgres",
        password="root"
    )

# ==========================================================
# USER AUTH (REGISTER)
# ==========================================================
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password required"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, hashed_pw)
        )
        conn.commit()
        cur.close()
        return jsonify({"message": "Registration successful!"}), 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email or Username already exists"}), 409

    except Exception as e:
        conn.rollback()
        print("[REGISTER ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# USER AUTH (LOGIN)
# ==========================================================
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username_or_email = data.get('username')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("""
            SELECT id, username, email, password_hash 
            FROM users 
            WHERE username = %s OR email = %s
        """, (username_or_email, username_or_email))

        row = cur.fetchone()
        cur.close()

        if not row:
            return jsonify({"error": "User not found"}), 404

        user_id, username, email, stored_hash = row

        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return jsonify({
                "message": "Login successful",
                "user_id": user_id,
                "username": username,
                "email": email
            })

        return jsonify({"error": "Invalid password"}), 401

    except Exception as e:
        print("[LOGIN ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# CREATE EVENT — WITH MIT PROTECTION
# ==========================================================
@app.route('/events', methods=['POST'])
def create_event():
    data = request.json
    creator_id = data.get("created_by")
    visibility = data.get("visibility", "public")
    image_url = data.get("image_url") or ""
    email = data.get("email", "")

    # ---- MIT check ----
    is_mit = email.endswith("@mitwpu.edu.in") or email.endswith("@mitwpu.ac.in")

    # If non-MIT user tries to set MIT visibility → FORCE PUBLIC
    if not is_mit and visibility == "mit":
        visibility = "public"

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO events (title, date, time, venue, description, image_url, created_by, visibility)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('title'),
            data.get('date'),
            data.get('time'),
            data.get('venue'),
            data.get('description'),
            image_url,
            creator_id,
            visibility
        ))

        conn.commit()
        cur.close()

        return jsonify({"message": "Event created"}), 201

    except Exception as e:
        conn.rollback()
        print("[CREATE EVENT ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# GET EVENTS — MIT FILTERING
# ==========================================================
@app.route('/events', methods=['GET'])
def get_events():
    email = request.args.get("email", "")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        is_mit = email.endswith("@mitwpu.edu.in") or email.endswith("@mitwpu.ac.in")

        if is_mit:
            cur.execute("SELECT * FROM events ORDER BY id DESC")
        else:
            cur.execute("SELECT * FROM events WHERE visibility='public' ORDER BY id DESC")

        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(rows)

    except Exception as e:
        print("[GET EVENTS ERROR]:", e)
        return jsonify({"error": str(e)}), 500

# ==========================================================
# UPDATE EVENT — STRICT MIT CONTROL
# ==========================================================
@app.route('/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.get_json()
    user_id = data.get('user_id')
    new_visibility = data.get('visibility', 'public')
    email = data.get("email", "")

    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    is_mit = email.endswith("@mitwpu.edu.in") or email.endswith("@mitwpu.ac.in")

    # Non-MIT CANNOT set event to MIT visibility
    if not is_mit and new_visibility == "mit":
        new_visibility = "public"

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("SELECT created_by FROM events WHERE id=%s", (event_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "Event not found"}), 404

        # Only creator can edit
        if str(row[0]) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        cur.execute("""
            UPDATE events
            SET title=%s, date=%s, time=%s, venue=%s, description=%s,
                image_url=%s, visibility=%s
            WHERE id=%s
        """, (
            data.get('title'),
            data.get('date'),
            data.get('time'),
            data.get('venue'),
            data.get('description'),
            data.get('image_url'),
            new_visibility,
            event_id
        ))

        conn.commit()
        cur.close()
        return jsonify({"message": "Event updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("[UPDATE ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# DELETE EVENT — ONLY CREATOR CAN DELETE
# ==========================================================
@app.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT created_by FROM events WHERE id=%s", (event_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "Event not found"}), 404

        # Only creator can delete
        if str(row[0]) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        cur.execute("DELETE FROM guests WHERE event_id=%s", (event_id,))
        cur.execute("DELETE FROM events WHERE id=%s", (event_id,))
        conn.commit()

        cur.close()
        return jsonify({"message": "Event deleted"}), 200

    except Exception as e:
        conn.rollback()
        print("[DELETE ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# RSVP + QR generation
# ==========================================================
@app.route('/rsvp', methods=['POST'])
def rsvp():
    data = request.json
    event_id = data.get('event_id')
    name = data.get('name')
    status = data.get('status')

    if not event_id or not name or not status:
        return jsonify({"error": "Missing RSVP data"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO guests (event_id, name, status)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (event_id, name, status))

        guest_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        qr_data = f"http://127.0.0.1:5500/frontend/html/checkin.html?guest_id={guest_id}&event_id={event_id}"
        qr_img = qrcode.make(qr_data)

        buf = BytesIO()
        qr_img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        return jsonify({
            "message": "RSVP saved",
            "guest_id": guest_id,
            "qr_image": f"data:image/png;base64,{qr_b64}",
            "qr_link": qr_data
        })

    except Exception as e:
        conn.rollback()
        print("[RSVP ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# GET ALL GUESTS
# ==========================================================
@app.route('/guests', methods=['GET'])
def get_all_guests():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT g.id, g.name, g.status, g.time_stamp,
                   e.title AS event_title, e.id AS event_id
            FROM guests g
            JOIN events e ON g.event_id = e.id
            ORDER BY g.time_stamp DESC
        """)
        rows = cur.fetchall()
        cur.close()
        return jsonify(rows)

    except Exception as e:
        print("[GUESTS ERROR]:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# ==========================================================
# EXPORT to Excel
# ==========================================================
@app.route('/export/<int:event_id>', methods=['GET'])
def export_excel(event_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT name, status, time_stamp FROM guests WHERE event_id=%s", (event_id,))
    df = pd.DataFrame(cur.fetchall(), columns=['Name', 'Status', 'Timestamp'])

    cur.close()
    conn.close()

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(output, download_name=f'event_{event_id}_guests.xlsx', as_attachment=True)

# ==========================================================
# RUN SERVER
# ==========================================================
if __name__ == '__main__':
    app.run(debug=True)
