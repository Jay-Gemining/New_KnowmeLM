from flask import Blueprint, send_from_directory, current_app
import os

static_bp = Blueprint('static_bp', __name__)

@static_bp.route('/', defaults={'path': ''})
@static_bp.route('/<path:path>')
def serve_react_app(path):
    # Use current_app.static_folder to access the app's static folder
    if path != "" and os.path.exists(os.path.join(current_app.static_folder, path)):
        return send_from_directory(current_app.static_folder, path)
    else:
        return send_from_directory(current_app.static_folder, 'index.html')
