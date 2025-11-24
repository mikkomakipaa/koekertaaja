# File Upload Size Limits

## Overview

This document explains the file upload size constraints in the Exam Prepper application and how they are implemented.

## Platform Constraints

### Vercel Deployment Limits

The application is deployed on Vercel, which has the following request body size limits:

- **Hobby Tier (Free)**: 5MB maximum request body size
- **Pro Tier**: 4.5MB default, configurable up to 100MB

Since the application targets the Hobby tier for accessibility, all file upload limits are designed to work within the **5MB total request size constraint**.

## Current Limits

### File Upload Constraints

- **Maximum file size**: 2MB per file
- **Maximum number of files**: 2 files
- **Maximum total size**: 4MB (files + text content)
- **Safety margin**: 4.5MB server validation (allows 0.5MB for overhead)

### Calculation

```
2 files × 2MB each = 4MB
+ ~0.5MB text content and overhead
+ ~0.5MB FormData encoding overhead
= ~5MB total (within Vercel limit)
```

## Implementation

### Client-Side Validation

**Location**: `src/components/create/MaterialUpload.tsx`

- Real-time validation before upload
- Checks individual file sizes
- Calculates and validates total request size
- Provides immediate user feedback
- Disables upload button when limits are reached

**User Experience**:
- Clear file size display (e.g., "1.23 MB")
- Total size tracking
- Descriptive error messages in Finnish
- Visual feedback with Alert components

### Server-Side Validation

**Location**: `src/app/api/generate-questions/route.ts`

- Double-checks all file size constraints
- Validates total request size before processing
- Returns HTTP 413 (Payload Too Large) with helpful error messages
- Prevents processing of oversized requests

**Safety Features**:
- Prevents "Request Entity Too Large" errors from Vercel
- Provides clear error messages about limits
- Suggests alternatives (split materials, use text instead)

## Configuration Files

### Next.js Configuration

**File**: `next.config.js`

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '30mb',  // For future use
  },
},
api: {
  bodyParser: {
    sizeLimit: '30mb',  // Pages Router only (not used)
  },
}
```

**Note**: The API route body size limits in `next.config.js` primarily apply to Pages Router (`/pages/api/*`). App Router (`/app/api/*`) routes are constrained by the deployment platform (Vercel).

### Vercel Configuration

**File**: `vercel.json`

```json
{
  "functions": {
    "src/app/api/generate-questions/route.ts": {
      "maxDuration": 300,  // 5 minutes for AI processing
      "memory": 1024       // 1GB RAM
    }
  }
}
```

## Increasing Limits (For Pro Users)

If you upgrade to Vercel Pro, you can increase the limits:

1. **Update client-side constants** in `src/components/create/MaterialUpload.tsx`:
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
   const MAX_FILES = 5; // 5 files
   const MAX_TOTAL_SIZE = 45 * 1024 * 1024; // 45MB total
   ```

2. **Update server-side constants** in `src/app/api/generate-questions/route.ts`:
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   const MAX_FILES = 5;
   const MAX_TOTAL_SIZE = 45 * 1024 * 1024; // 45MB
   ```

3. **Configure Vercel** via `vercel.json` or Dashboard:
   ```json
   {
     "functions": {
       "src/app/api/generate-questions/route.ts": {
         "maxDuration": 300,
         "memory": 3008,
         "maxRequestBodySize": 52428800  // 50MB in bytes
       }
     }
   }
   ```

## Troubleshooting

### "Request Entity Too Large" Error

**Cause**: Total request size exceeds Vercel's limit

**Solutions**:
1. Reduce file sizes (compress PDFs, optimize images)
2. Upload fewer files at once
3. Use text input instead of file uploads for text content
4. Split materials into multiple question sets
5. Upgrade to Vercel Pro for higher limits

### Files Not Uploading

**Check**:
1. Individual file size (must be ≤ 2MB)
2. Number of files (must be ≤ 2)
3. Total size of all files (must be ≤ 4MB)
4. Browser console for client-side validation errors

### Allowed File Types

- **Documents**: PDF, TXT, DOC, DOCX
- **Images**: JPEG, PNG, GIF, WebP
- **Security**: Server-side MIME type validation using magic bytes

## User Guidance

### Best Practices for Users

1. **Compress PDFs**: Use online tools or PDF software to reduce file size
2. **Optimize Images**: Resize images to reasonable dimensions (e.g., 1920×1080)
3. **Text Content**: For text-heavy materials, copy-paste into the text field instead of uploading
4. **Split Materials**: Create multiple question sets for different chapters/topics
5. **File Priority**: Upload the most important reference materials only

### Alternative Approaches

If materials exceed limits:

1. **Text Input**: Copy text content directly into the text field (up to 50,000 characters)
2. **External Links**: Reference online materials in the text field
3. **Multiple Sets**: Create separate question sets for different sections
4. **Summarize**: Provide key points rather than full documents

## Technical Details

### Request Size Breakdown

A typical request includes:
- FormData multipart boundaries: ~1-2KB
- Field names and metadata: ~1KB
- File content (base64 encoded on client): +33% size
- Text content: up to 50KB
- Other form fields: ~1KB

### Why Not Increase Limits?

1. **Platform Constraints**: Vercel Hobby tier hard limit of 5MB
2. **Cost**: Pro tier costs $20/month per team member
3. **Accessibility**: Free tier keeps the app accessible to all users
4. **Performance**: Smaller uploads = faster processing
5. **AI Costs**: Smaller context = lower Anthropic API costs

## Related Files

- `src/components/create/MaterialUpload.tsx` - Client-side validation
- `src/app/api/generate-questions/route.ts` - Server-side validation
- `src/lib/validation/schemas.ts` - Input validation schemas
- `next.config.js` - Next.js configuration
- `vercel.json` - Vercel deployment configuration
