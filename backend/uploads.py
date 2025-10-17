import os
import uuid
import boto3
from typing import Dict, Any
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

# S3 Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'vaishnavi-printers-uploads')
S3_REGION = os.environ.get('S3_REGION', 'ap-south-1')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
USE_S3 = os.environ.get('USE_S3', 'false').lower() == 'true'

def get_s3_client():
    """Get S3 client"""
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=S3_REGION
        )
    else:
        # Use IAM role if running on AWS
        return boto3.client('s3', region_name=S3_REGION)

def generate_upload_signed_url(file_name: str, file_type: str, expiration: int = 3600) -> Dict[str, Any]:
    """Generate signed URL for direct browser upload to S3"""
    if not USE_S3:
        # Fallback to local storage simulation
        upload_id = str(uuid.uuid4())
        return {
            "upload_id": upload_id,
            "signed_url": f"/api/upload/local/{upload_id}",
            "file_key": f"local/{upload_id}/{file_name}",
            "method": "PUT",
            "storage_type": "local"
        }
    
    try:
        s3_client = get_s3_client()
        upload_id = str(uuid.uuid4())
        file_key = f"uploads/{upload_id}/{file_name}"
        
        # Generate presigned URL for PUT
        signed_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': file_key,
                'ContentType': file_type
            },
            ExpiresIn=expiration,
            HttpMethod='PUT'
        )
        
        return {
            "upload_id": upload_id,
            "signed_url": signed_url,
            "file_key": file_key,
            "method": "PUT",
            "storage_type": "s3"
        }
    except ClientError as e:
        logger.error(f"Error generating signed URL: {e}")
        raise

def generate_download_signed_url(file_key: str, expiration: int = 3600) -> str:
    """Generate signed URL for downloading from S3"""
    if not USE_S3:
        return f"/api/download/local/{file_key}"
    
    try:
        s3_client = get_s3_client()
        signed_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': file_key
            },
            ExpiresIn=expiration
        )
        return signed_url
    except ClientError as e:
        logger.error(f"Error generating download URL: {e}")
        raise

def simulate_virus_scan(file_key: str) -> Dict[str, Any]:
    """Simulate virus scan (placeholder for real integration)"""
    # In production, this would integrate with ClamAV or a cloud service
    logger.info(f"[SIMULATED] Virus scan for {file_key}: CLEAN")
    return {
        "status": "clean",
        "file_key": file_key,
        "scanned_at": "2025-01-15T00:00:00Z"
    }
