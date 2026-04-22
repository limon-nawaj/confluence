import cloudinary
import cloudinary.uploader
from app.config import settings


def init_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_file(content: bytes, public_id: str, folder: str, resource_type: str = "auto") -> dict:
    """Upload raw bytes to Cloudinary. Returns the Cloudinary response dict."""
    return cloudinary.uploader.upload(
        content,
        public_id=public_id,
        folder=folder,
        resource_type=resource_type,
        use_filename=False,
        overwrite=True,
    )


def delete_file(public_id: str, resource_type: str = "raw") -> None:
    """Delete a file from Cloudinary by its full public_id."""
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    # Also try image type in case it was auto-detected as image
    cloudinary.uploader.destroy(public_id, resource_type="image")
