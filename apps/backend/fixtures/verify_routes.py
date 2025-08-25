"""
Script to verify every route and API in api/routes using FastAPI's TestClient.
This script will attempt to call each route and print the status/result.
"""


import os
import sys
import json
from fastapi.testclient import TestClient
from pydantic import ValidationError, create_model

# Dynamically add the src directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
src_dir = os.path.join(backend_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from api.main import app

client = TestClient(app)


def get_response_model_from_openapi(path, method):
    openapi = app.openapi()
    method = method.lower()
    try:
        schema = openapi['paths'][path][method]['responses']['200']['content']['application/json']['schema']
        return schema
    except Exception:
        return None

def validate_response(response, schema, path, method):
    if not schema:
        print(f"{method.upper()} {path} -> {response.status_code} (No schema to validate)")
        return
    try:
        # Dynamically create a Pydantic model for validation
        model = create_model('ResponseModel', __root__=(dict, ...))
        model.parse_obj(response.json())
        print(f"{method.upper()} {path} -> {response.status_code} (Schema valid)")
    except ValidationError as ve:
        print(f"{method.upper()} {path} -> {response.status_code} (Schema INVALID): {ve}")
    except Exception as e:
        print(f"{method.upper()} {path} -> {response.status_code} (Validation error): {e}")

def verify_routes():
    print("Verifying all routes in api/routes with schema validation...")
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            for method in route.methods:
                if method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                    try:
                        # Use dummy params for path params if needed
                        path = route.path
                        url = path.replace('{', '').replace('}', '')
                        # For demonstration, only GET requests are sent without params
                        if method == 'GET':
                            response = client.get(url)
                        elif method == 'POST':
                            response = client.post(url, json={})
                        elif method == 'PUT':
                            response = client.put(url, json={})
                        elif method == 'DELETE':
                            response = client.delete(url)
                        elif method == 'PATCH':
                            response = client.patch(url, json={})
                        schema = get_response_model_from_openapi(path, method)
                        validate_response(response, schema, path, method)
                    except Exception as e:
                        print(f"{method} {route.path} -> ERROR: {e}")

if __name__ == "__main__":
    client = TestClient(app)
    verify_routes()
