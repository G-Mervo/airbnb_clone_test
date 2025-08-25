"""
Authentication service for handling user authentication and authorization
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging

try:
    from passlib.context import CryptContext
    PASSLIB_AVAILABLE = True
except ImportError:
    PASSLIB_AVAILABLE = False
    import hashlib

try:
    from jose import jwt, JWTError
    JOSE_AVAILABLE = True
except ImportError:
    JOSE_AVAILABLE = False
    import json
    import base64

from fastapi import HTTPException, status

from .base_service import ValidationError, NotFoundError, ConflictError
from .user_service import UserService

# Try to import settings, create default if not available
try:
    from config.settings import settings
except ImportError:
    class MockSettings:
        secret_key = 'mock-secret-key-for-development'
        algorithm = 'HS256'
        access_token_expire_minutes = 30
    settings = MockSettings()

logger = logging.getLogger(__name__)

class AuthService:
    """Service for authentication operations"""

    def __init__(self, user_service: UserService):
        self.user_service = user_service

        # Initialize password hashing
        if PASSLIB_AVAILABLE:
            self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        else:
            self.pwd_context = None
            logger.warning("passlib not available, using simple hash for development")

        # Initialize JWT settings
        self.secret_key = getattr(settings, 'secret_key', 'your-secret-key')
        self.algorithm = getattr(settings, 'algorithm', 'HS256')
        self.access_token_expire_minutes = getattr(settings, 'access_token_expire_minutes', 30)

    def hash_password(self, password: str) -> str:
        """Hash a password"""
        if PASSLIB_AVAILABLE and self.pwd_context:
            return self.pwd_context.hash(password)
        else:
            # Simple hash for development (NOT for production)
            return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        if PASSLIB_AVAILABLE and self.pwd_context:
            return self.pwd_context.verify(plain_password, hashed_password)
        else:
            # Simple verification for development
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token

        Args:
            data: Data to encode in the token
            expires_delta: Token expiration time

        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({"exp": expire.timestamp()})

        if JOSE_AVAILABLE:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        else:
            # Simple token for development (NOT secure for production)
            import json
            import base64
            token_data = json.dumps(to_encode)
            return base64.b64encode(token_data.encode()).decode()

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a JWT token

        Args:
            token: JWT token to verify

        Returns:
            Decoded token payload

        Raises:
            HTTPException: If token is invalid
        """
        try:
            if JOSE_AVAILABLE:
                payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            else:
                # Simple token verification for development
                import json
                import base64
                decoded_data = base64.b64decode(token.encode()).decode()
                payload = json.loads(decoded_data)

                # Check expiration
                if 'exp' in payload:
                    if datetime.now(timezone.utc).timestamp() > payload['exp']:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token has expired",
                            headers={"WWW-Authenticate": "Bearer"},
                        )

            email: str = payload.get("sub")
            if email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return payload

        except (ValueError, KeyError, json.JSONDecodeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def register_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a new user

        Args:
            user_data: User registration data

        Returns:
            Created user data (without password)

        Raises:
            ValidationError: If user data is invalid
            ConflictError: If user already exists
        """
        try:
            # Hash the password before storing
            if 'password' in user_data:
                user_data['password'] = self.hash_password(user_data['password'])

            # Add default fields
            user_data.update({
                'is_active': True,
                'is_verified': False,
                'is_host': False,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            })

            # Create user through user service
            new_user = self.user_service.create(user_data)

            # Return user without password
            return self.user_service.get_user_profile(new_user['id'])

        except (ValidationError, ConflictError) as e:
            logger.error(f"User registration failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during user registration: {str(e)}")
            raise ValidationError("Registration failed due to internal error")

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            User data if authentication successful, None otherwise
        """
        try:
            user = self.user_service.get_user_by_email(email)
            if not user:
                return None

            if not self.verify_password(password, user.get('password', '')):
                return None

            return user

        except Exception as e:
            logger.error(f"Authentication error for email {email}: {str(e)}")
            return None

    def login_user(self, email: str, password: str) -> Dict[str, str]:
        """
        Login a user and return access token

        Args:
            email: User email
            password: User password

        Returns:
            Dictionary containing access token and token type

        Raises:
            HTTPException: If authentication fails
        """
        user = self.authenticate_user(email, password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # DEBUG print settings
        access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={"sub": user["email"], "user_id": user["id"]},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": access_token_expires.total_seconds()
        }

    def get_current_user_from_token(self, token: str) -> Dict[str, Any]:
        """
        Get current user from JWT token

        Args:
            token: JWT token

        Returns:
            User data

        Raises:
            HTTPException: If token is invalid or user not found
        """
        payload = self.verify_token(token)
        email = payload.get("sub")

        user = self.user_service.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    def refresh_token(self, token: str) -> Dict[str, str]:
        """
        Refresh an access token

        Args:
            token: Current JWT token

        Returns:
            New access token
        """
        user = self.get_current_user_from_token(token)

        access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={"sub": user["email"], "user_id": user["id"]},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
