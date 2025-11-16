import os
import uuid
from dotenv import load_dotenv

from flask import (
    Flask, request, jsonify, send_from_directory,
    session, redirect, url_for
)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager, UserMixin, login_user, logout_user,
    current_user, login_required
)
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta, timezone
import calendar

load_dotenv()

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = os.getenv(
    'SECRET_KEY', 'insecure-fallback-key-for-local-dev-only')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + \
    os.path.join(BASE_DIR, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'serve_index'
login_manager.session_protection = "strong"

CORS(app, supports_credentials=True, origins=[
     "http://127.0.0.1:3000", "http://localhost:5500", "https://snapserve.pages.dev"])

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_guest = db.Column(db.Boolean, default=False)
    images = db.relationship('Image', backref='uploader', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(
            password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(120), unique=True, nullable=False)
    upload_date = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def is_expiring_soon(self):
        if not self.expires_at:
            return False

        expires_at_aware = self.expires_at
        if expires_at_aware.tzinfo is None:
            expires_at_aware = expires_at_aware.replace(tzinfo=timezone.utc)

        return expires_at_aware < datetime.now(timezone.utc) + timedelta(days=3)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/auth_status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'username': current_user.username,
            'is_guest': current_user.is_guest
        }), 200
    return jsonify({'authenticated': False}), 200


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'error': 'Missing username or password'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'Username already exists'}), 409

    new_user = User(username=username, is_guest=False)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user)
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'username': new_user.username,
            'is_guest': new_user.is_guest
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {e}")
        return jsonify({'success': False, 'error': 'A server error occurred'}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        login_user(user)
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'username': user.username,
            'is_guest': user.is_guest
        }), 200

    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401


@app.route('/guest_login', methods=['POST'])
def guest_login():
    """Creates a temporary guest account and logs the user in."""
    try:
        guest_username = f"Guest-{uuid.uuid4().hex[:8]}"

        new_guest = User(username=guest_username, is_guest=True)
        new_guest.set_password(uuid.uuid4().hex)

        db.session.add(new_guest)
        db.session.commit()

        login_user(new_guest)

        return jsonify({
            'success': True,
            'message': 'Guest login successful',
            'username': new_guest.username,
            'is_guest': new_guest.is_guest
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error during guest login: {e}")
        return jsonify({'success': False, 'error': 'A server error occurred during guest login'}), 500


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out'}), 200


def get_next_month_start(current_date):
    """Calculates the datetime of the first day of the next month."""
    if current_date.month == 12:
        next_month = 1
        next_year = current_date.year + 1
    else:
        next_month = current_date.month + 1
        next_year = current_date.year

    return datetime(next_year, next_month, 1, tzinfo=timezone.utc)


@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        filepath = os.path.join(
            app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)

        expiration_time = get_next_month_start(datetime.now(timezone.utc))

        new_image = Image(
            user_id=current_user.id,
            filename=unique_filename,
            expires_at=expiration_time
        )

        try:
            db.session.add(new_image)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'image_url': url_for('uploaded_file', filename=unique_filename, _external=True),
                'details_id': new_image.id
            }), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error saving image metadata: {e}")
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'success': False, 'error': 'Failed to save image metadata'}), 500

    return jsonify({'success': False, 'error': 'File type not allowed'}), 400


@app.route('/images', methods=['GET'])
@login_required
def get_user_images():
    images = current_user.images.order_by(
        Image.upload_date.desc()).all()
    image_list = [{
        'id': img.id,
        'url': url_for('uploaded_file', filename=img.filename, _external=True),
        'filename': img.filename,
        'upload_date': img.upload_date.isoformat(),
        'expires_at': img.expires_at.isoformat() if img.expires_at else None,
        'is_expiring_soon': img.is_expiring_soon()
    } for img in images]
    return jsonify(image_list), 200


@app.route('/image/<int:image_id>', methods=['GET'])
def get_image_details(image_id):
    image = db.session.get(Image, image_id)
    if not image:
        return jsonify({"success": False, "error": "Image not found."}), 404

    is_owner = current_user.is_authenticated and image.user_id == current_user.id

    if image.expires_at:
        expires_at_aware = image.expires_at
        if expires_at_aware.tzinfo is None:
            expires_at_aware = expires_at_aware.replace(tzinfo=timezone.utc)

        if expires_at_aware < datetime.now(timezone.utc):
            file_path = os.path.join(
                app.config['UPLOAD_FOLDER'], image.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            db.session.delete(image)
            db.session.commit()
            return jsonify({"success": False, "error": "This image has expired and has been deleted."}), 410

    return jsonify({
        "success": True,
        'url': url_for('uploaded_file', filename=image.filename, _external=True),
        'filename': image.filename,
        'upload_date': image.upload_date.isoformat(),
        'expires_at': image.expires_at.isoformat() if image.expires_at else None,
        'is_owner': is_owner,
    }), 200


@app.route('/image/<int:image_id>', methods=['DELETE'])
@login_required
def delete_image(image_id):
    try:
        image = db.session.get(Image, image_id)
        if not image:
            return jsonify({"success": False, "error": "Image not found."}), 404
        if image.user_id != current_user.id:
            return jsonify({"success": False, "error": "Unauthorized."}), 403
        file_path = os.path.join(
            app.config['UPLOAD_FOLDER'], image.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.session.delete(image)
        db.session.commit()
        return jsonify({"success": True, "message": "Image deleted."}), 200
    except Exception as e:
        print(f"Error deleting image: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Server error."}), 500


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    image = Image.query.filter_by(filename=filename).first()
    if not image:
        return "Image not found.", 404

    if image.expires_at:
        expires_at_aware = image.expires_at
        if expires_at_aware.tzinfo is None:
            expires_at_aware = expires_at_aware.replace(tzinfo=timezone.utc)

        if expires_at_aware < datetime.now(timezone.utc):
            file_path = os.path.join(
                app.config['UPLOAD_FOLDER'], image.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            db.session.delete(image)
            db.session.commit()
            return "This image has expired and has been deleted.", 410

    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
