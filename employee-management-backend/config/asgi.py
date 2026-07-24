import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings.production"
)

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import apps.attendance.routing
import apps.communication.websocket.routing

websocket_routes = (
    apps.attendance.routing.websocket_urlpatterns +
    apps.communication.websocket.routing.websocket_urlpatterns
)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_routes
            )
        )
    ),
})