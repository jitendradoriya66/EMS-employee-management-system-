from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid
import os

User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("credential")
        if not token:
            return Response({"error": "No credential provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
            if client_id:
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
            else:
                # If no client ID is set (local dev), we can use verify_oauth2_token without audience
                # or manually decode if needed, but verify_oauth2_token expects an audience.
                # Let's bypass audience check if no client_id is provided, for demo purposes.
                import jwt
                idinfo = jwt.decode(token, options={"verify_signature": False})

            email = idinfo.get('email')
            if not email:
                return Response({"error": "Token missing email"}, status=status.HTTP_400_BAD_REQUEST)
                
            first_name = idinfo.get('given_name', email.split('@')[0])
            last_name = idinfo.get('family_name', '')
            
            user, created = User.objects.get_or_create(email=email, defaults={
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
                'employee_id': f"EMP{str(uuid.uuid4())[:8].upper()}"
            })
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
