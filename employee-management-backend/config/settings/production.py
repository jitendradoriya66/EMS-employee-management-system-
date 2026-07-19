from .base import *
import os

# ----------------------------
# Production Settings
# ----------------------------

DEBUG = False

ALLOWED_HOSTS = os.environ.get(
    "ALLOWED_HOSTS",
    ""
).split(",")

# ----------------------------
# Security
# ----------------------------

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = False   # Render already handles HTTPS

SESSION_COOKIE_SECURE = True

CSRF_COOKIE_SECURE = True

# ----------------------------
# Static Files
# ----------------------------

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)

MIDDLEWARE.insert(
    1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)

# ----------------------------
# CSRF
# ----------------------------

CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    ""
).split(",")