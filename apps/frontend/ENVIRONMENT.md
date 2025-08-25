# Environment Configuration Guide

This document explains how to configure environment variables for the Airbnb Frontend application.

## Overview

The application uses environment variables to configure various aspects of the system including API endpoints, feature flags, and UI behavior. Environment variables are prefixed with `VITE_` to ensure they are available in the browser.

## Environment Files

The application supports multiple environment files for different deployment scenarios:

- `.env.local` - Local development (not committed to git)
- `.env.development` - Development environment settings
- `.env.production` - Production environment settings
- `.env.example` - Template file showing all available options

## Configuration Options

### API Configuration

| Variable                  | Description                                  | Default                 | Example                   |
| ------------------------- | -------------------------------------------- | ----------------------- | ------------------------- |
| `VITE_API_BASE_URL`       | Base URL for backend API                     | `http://localhost:8000` | `https://api.example.com` |
| `VITE_API_TIMEOUT`        | Request timeout in milliseconds              | `10000`                 | `15000`                   |
| `VITE_API_RETRY_ATTEMPTS` | Number of retry attempts for failed requests | `3`                     | `5`                       |
| `VITE_API_ENABLE_LOGGING` | Enable API request/response logging          | `true`                  | `false`                   |

### Data Source Configuration

| Variable           | Description           | Options                | Default |
| ------------------ | --------------------- | ---------------------- | ------- |
| `VITE_DATA_SOURCE` | Data loading strategy | `local`, `api`, `mock` | `local` |

### Feature Flags

| Variable                      | Description                    | Default  |
| ----------------------------- | ------------------------------ | -------- |
| `VITE_ENABLE_DATA_VALIDATION` | Enable data validation         | `true`   |
| `VITE_CACHE_ENABLED`          | Enable data caching            | `true`   |
| `VITE_CACHE_DURATION_MS`      | Cache duration in milliseconds | `300000` |
| `VITE_ENABLE_BOOKING`         | Enable booking functionality   | `true`   |
| `VITE_ENABLE_PAYMENTS`        | Enable payment processing      | `false`  |
| `VITE_ENABLE_REALTIME`        | Enable real-time features      | `false`  |
| `VITE_ENABLE_OFFLINE`         | Enable offline mode            | `false`  |
| `VITE_ENABLE_ANALYTICS`       | Enable analytics tracking      | `false`  |

### UI Configuration

| Variable                      | Description                   | Default |
| ----------------------------- | ----------------------------- | ------- |
| `VITE_ITEMS_PER_PAGE`         | Number of items per page      | `20`    |
| `VITE_ENABLE_INFINITE_SCROLL` | Enable infinite scroll        | `true`  |
| `VITE_SHOW_SKELETON_LOADER`   | Show skeleton loading states  | `true`  |
| `VITE_SKELETON_DURATION`      | Skeleton loader duration (ms) | `2500`  |

## Environment-Specific Settings

### Development (.env.development)

- Lower timeout values for faster feedback
- Reduced retry attempts
- Enhanced logging enabled
- Mock data features enabled
- Smaller page sizes for testing

### Production (.env.production)

- Higher timeout values for stability
- Increased retry attempts
- Logging disabled for performance
- All features enabled
- Optimized page sizes

### Local (.env.local)

- Customizable for individual developer preferences
- Not committed to version control
- Overrides other environment files

## Setup Instructions

### 1. For Local Development

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your local settings
nano .env.local
```

### 2. For Production Deployment

```bash
# Use production settings
cp .env.production .env

# Update API_BASE_URL with your production API endpoint
# Update other settings as needed for your deployment
```

### 3. Environment Variable Precedence

Vite loads environment variables in this order (highest to lowest precedence):

1. `.env.local` (always loaded, ignored by git)
2. `.env.[mode]` (e.g., `.env.production`)
3. `.env`
4. Built-in defaults in the code

## API Client Integration

The `apiClient.ts` automatically uses these environment variables:

```typescript
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10),
  enableLogging: import.meta.env.VITE_API_ENABLE_LOGGING === 'true',
};
```

## Common Scenarios

### Switching to API Data Source

```bash
# In your .env.local file
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

### Disabling Features for Testing

```bash
# Disable payments and real-time features
VITE_ENABLE_PAYMENTS=false
VITE_ENABLE_REALTIME=false
```

### Performance Tuning

```bash
# Increase cache duration for better performance
VITE_CACHE_DURATION_MS=600000

# Increase page size for fewer requests
VITE_ITEMS_PER_PAGE=50
```

## Security Considerations

- Never commit `.env.local` to version control
- Use different API keys/secrets for different environments
- In production, consider using environment-specific secrets management
- Be cautious with logging settings in production to avoid exposing sensitive data

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Ensure they start with `VITE_`
2. **API timeouts**: Increase `VITE_API_TIMEOUT` value
3. **Network issues**: Check `VITE_API_BASE_URL` format and connectivity
4. **Feature not working**: Verify corresponding feature flag is enabled

### Debug Steps

1. Check browser console for environment variable values:

   ```javascript
   console.log(import.meta.env);
   ```

2. Verify API configuration:

   ```javascript
   // In browser console
   console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
   ```

3. Test API connectivity:
   ```bash
   curl http://localhost:8000/health
   ```

## Examples

### Complete Development Setup

```bash
# .env.local for development
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=5000
VITE_API_RETRY_ATTEMPTS=2
VITE_API_ENABLE_LOGGING=true
VITE_DATA_SOURCE=local
VITE_ENABLE_DATA_VALIDATION=true
VITE_CACHE_ENABLED=false
VITE_ENABLE_BOOKING=true
VITE_ENABLE_PAYMENTS=false
VITE_ITEMS_PER_PAGE=12
VITE_SHOW_SKELETON_LOADER=true
```

### Complete Production Setup

```bash
# .env.production for production
VITE_API_BASE_URL=https://api.yourapp.com
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=5
VITE_API_ENABLE_LOGGING=false
VITE_DATA_SOURCE=api
VITE_ENABLE_DATA_VALIDATION=true
VITE_CACHE_ENABLED=true
VITE_CACHE_DURATION_MS=600000
VITE_ENABLE_BOOKING=true
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_REALTIME=true
VITE_ITEMS_PER_PAGE=24
```

This configuration system provides flexibility for different deployment scenarios while maintaining secure and performant defaults.
