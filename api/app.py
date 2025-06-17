from flask import Flask, request, send_file, jsonify
from werkzeug.utils import secure_filename
from pathlib import Path
from data_processing_sample import process_image
from flask_cors import CORS
from celery import Celery  
import logging
import os

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'  # Redis broker
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'  # Store task

CORS(app, origins=["http://localhost:3000"])

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.errorhandler(Exception)
def handle_error(e):
    logging.error(f"Error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def too_large():
    return jsonify({'error': 'File too large, max 16MB'}), 413

@celery.task
def process_image_task(input_path, light, heavy):
    from data_processing_sample import process_image
    output_path = process_image(Path(input_path), light=light, heavy=heavy)
    return str(output_path) 

@app.route('/process', methods=['POST'])
def process():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)
    task = process_image_task.delay(input_path, light=request.form.get('light') == 'true', heavy=request.form.get('heavy') == 'true')
    return jsonify({'task_id': task.id}), 202

@app.route('/task/<task_id>', methods=['GET'])
def get_task(task_id):
    task = process_image_task.AsyncResult(task_id)
    if task.ready():
        output_path = Path(task.get())
        return send_file(output_path, mimetype='image/jpeg')
    return jsonify({'status': 'pending'}), 202


if __name__ == '__main__':
    app.run(debug=True)


