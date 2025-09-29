from flask import Blueprint, request, session, redirect, render_template, flash, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import users_collection, news_collection, social_collection, s3_client
from werkzeug.utils import secure_filename
import os
from bson.objectid import ObjectId
import boto3
from botocore.exceptions import ClientError
# routes/image_routes.py
image_bp = Blueprint('image', __name__)


S3_BUCKET = 'newstagging'
S3_FOLDER = 'uploaded_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@image_bp.route('/upload', methods=['POST'])
def upload():
    username = session['username']
    level = session['level']
    companyid = session['company']
    user_data = users_collection.find_one({"username": username})

    try:
        designation = user_data.get('designation')
    except:
        designation = ''
    try:
        company = user_data.get('company')
    except:
        company = ''

    card_id = request.form.get('card_id', 'default')
    project_id = request.form.get('project_id', 'default')
    page = request.form.get('page', 'default')
    description = request.form.get('description', '')

    if not card_id:
        return jsonify({"message": "Document _id is missing."}), 400
    try:
        object_id = ObjectId(card_id)
    except:
        return jsonify({"message": "Invalid _id format."}), 400

    # Case 1: File Upload
    if 'image' in request.files and request.files['image'].filename != '':
        file = request.files['image']

        if not allowed_file(file.filename):
            ext = file.filename.split('.')[-1]
            current_app.logger.warning(f"Disallowed extension attempted: {ext}")
            return jsonify({"error": "File with extension png, jpg, jpeg, gif are allowed"}), 400

        stored_filename = secure_filename(file.filename)
        s3_key = f"{S3_FOLDER}/{companyid}/{project_id}/{card_id}/{stored_filename}"

        # Upload to S3
        s3_client.upload_fileobj(
            file, 
            S3_BUCKET, 
            s3_key,
            ExtraArgs={
                "ContentType": "image/jpeg",  # could be improved by detecting actual MIME
                "ACL": "public-read"
            }
        )
        file_url = f"https://{S3_BUCKET}.s3.ap-south-1.amazonaws.com/{s3_key}"

    # Case 2: Image URL
    elif 'image_url' in request.form and request.form['image_url'].strip() != '':
        file_url = request.form['image_url'].strip()

    else:
        return jsonify({"error": "No image file or URL provided"}), 400

    # Prepare DB update
    query = {"_id": object_id}
    update = {
        "$push": {
            f"addedImages.{companyid}.{project_id}.{card_id}": {
                "path": file_url,
                "description": description
            }
        }
    }

    if page == 'news':
        result = news_collection.update_one(query, update)
    else:
        result = social_collection.update_one(query, update)

    current_app.logger.info(f"Image added: {file_url} by {username}")

    return jsonify({"image_url": file_url, "description": description}), 200


@image_bp.route('/list-images/<companyid>/<project_id>/<card_id>')
def list_images(companyid, project_id, card_id):
    prefix = f"{S3_FOLDER}/{companyid}/{project_id}/{card_id}/"
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        if 'Contents' not in response:
            return jsonify([])

        files = []
        for obj in response['Contents']:
            key = obj['Key']
            filename = os.path.basename(key)
            ext = filename.split('.')[-1].lower()

            if ext in allowed_extensions:
                # Construct public URL
                file_url = f"https://{S3_BUCKET}.s3.ap-south-1.amazonaws.com/{key}"
                files.append(file_url)

        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@image_bp.route('/delete', methods=['POST'])
def delete_image():
    data = request.json
    companyid = session['company']

    image_url = data.get('image_url')
    card_id = data.get('card_id', 'default')
    project_id = data.get('project_id', 'default')
    page = data.get('page', 'default')

    if not image_url or not card_id:
        return jsonify({"message": "Image URL or Document _id is missing."}), 400
    try:
        object_id = ObjectId(card_id)
    except:
        return jsonify({"message": "Invalid _id format."}), 400

    current_app.logger.info(
        f"Deleting image with URL: {image_url} for card_id: {card_id}, project_id: {project_id}, page: {page}"
    )

    # Remove reference from DB first
    query = {"_id": object_id}
    update = {
        "$pull": {
            f"addedImages.{companyid}.{project_id}.{card_id}": {
                "path": image_url
            }
        }
    }
    if page == "news":
        result = news_collection.update_one(query, update)
    else:
        result = social_collection.update_one(query, update)

    # Only delete from S3 if it's from our managed upload folder
    s3_prefix = f"https://{S3_BUCKET}.s3.ap-south-1.amazonaws.com/uploaded_images/"
    if image_url.startswith(s3_prefix):
        try:
            key = image_url[len(f"https://{S3_BUCKET}.s3.ap-south-1.amazonaws.com/"):]
            s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
            current_app.logger.info(f"S3 object deleted: {key}")
        except Exception as e:
            current_app.logger.error(f"S3 delete failed for {image_url}: {e}")
    else:
        current_app.logger.info(f"Skipped S3 delete (external URL): {image_url}")

    return jsonify({"message": "Image deleted successfully."}), 200