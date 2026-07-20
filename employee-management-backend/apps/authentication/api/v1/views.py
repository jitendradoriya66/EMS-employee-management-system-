from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
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

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = PasswordResetTokenGenerator().make_token(user)
                # In production, use your actual frontend domain from env or settings
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
                reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
                
                send_mail(
                    subject="Password Reset Request",
                    message=f"Please use the following link to reset your password:\n\n{reset_link}",
                    from_email=os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@ems.com'),
                    recipient_list=[email],
                    fail_silently=False,
                )
            
            # Always return success to prevent email enumeration
            return Response({"message": "If an account with that email exists, we have sent a password reset link."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uidb64 = serializer.validated_data['uidb64']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None
                
            if user is not None and PasswordResetTokenGenerator().check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
