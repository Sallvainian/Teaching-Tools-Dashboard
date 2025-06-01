# Microsoft Teams-Style File Permissions Implementation

## Overview

This implementation adds Microsoft Teams-style file sharing and permission management to the educational dashboard, allowing teachers and students to share files with granular access controls.

## Key Features

### Permission Levels (Teams-style)
- **View**: Can view and download files
- **Edit**: Can view, edit, and download files
- **Contribute**: Can view, edit, upload, and delete files
- **Owner**: Full control including sharing and permissions

### Share Scopes
- **Private**: Only specific users
- **Class**: Shared with specific classes
- **School**: Shared with all teachers/students
- **Public**: Anyone with link can access

### Educational Context
- Role-based access (Teacher, Student, Admin)
- Class-based sharing
- Student-teacher relationship awareness

## Database Schema

### New Tables

#### `file_permissions`
```sql
CREATE TABLE file_permissions (
    id UUID PRIMARY KEY,
    file_id UUID REFERENCES file_metadata(id),
    user_id UUID REFERENCES app_users(id),     -- Direct user permission
    class_id UUID REFERENCES classes(id),      -- Class-based permission  
    role TEXT CHECK (role IN ('teacher', 'student', 'admin')), -- Role-based
    permission_level TEXT CHECK (permission_level IN ('view', 'edit', 'contribute', 'owner')),
    share_scope TEXT CHECK (share_scope IN ('private', 'class', 'school', 'public')),
    granted_by UUID REFERENCES app_users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
```

#### Enhanced Tables
- `file_metadata`: Added `is_shared` and `share_scope` columns
- `classes`: Educational class management
- `class_students`: Student enrollment tracking

## Implementation Files

### Core Service Layer
- `src/lib/services/filePermissionService.ts`: Main permission management
- `src/lib/types/files.ts`: Extended with permission types

### UI Components  
- `src/lib/components/FilePermissionModal.svelte`: Sharing dialog
- `src/lib/components/FilePermissionButton.svelte`: Quick share button

### Navigation & Access Control
- `src/lib/utils/roleBasedNavigation.ts`: Role-based route filtering
- Updated `AppSidebar.svelte`: Dynamic navigation based on user role

### Database Migrations
- `file_permissions_migration.sql`: Complete schema setup
- `file_permissions_rls.sql`: Row Level Security policies

## Usage Examples

### Share a File with a Class
```typescript
const result = await filePermissionService.shareFile({
    file_id: 'file-uuid',
    shared_with_type: 'class',
    shared_with_id: 'class-uuid',
    permission_level: 'edit',
    share_scope: 'class'
}, currentUserId);
```

### Check User Permissions
```typescript
const userPermission = await filePermissionService.getUserFilePermission(
    'file-uuid', 
    'user-uuid'
);
// Returns: 'view' | 'edit' | 'contribute' | 'owner'
```

### Get Files Shared with User
```typescript
const sharedFiles = await filePermissionService.getSharedWithUser('user-uuid');
```

## Security Features

### Row Level Security (RLS)
- Users can only see permissions relevant to them
- File owners control access to their files
- Class-based permissions respect enrollment
- Role-based permissions match user roles

### Permission Hierarchy
- Cannot grant higher permissions than you have
- Owners have ultimate control
- Permission escalation prevented

### Audit Trail
- All permissions track who granted them and when
- Optional expiration dates
- Complete sharing history

## Student Access Control

### Before Implementation
- Students had access to all teacher modules
- No role-based navigation filtering
- Same interface for all user types

### After Implementation  
- Role-based navigation: `getNavigationForRole(userRole)`
- Student-specific routes: `/student/dashboard`, `/student/games`
- Access validation: `validateRouteAccess(userRole, route)`
- Appropriate redirects for unauthorized access

## Integration Points

### File Management
- Share buttons on file listings
- Permission indicators on file cards
- "Shared with me" view for received files

### Class Management
- Teachers can share with their classes
- Students see files shared by teachers
- Class-based permission inheritance

### Role-Based Features
- Teacher modules: Classes, Gradebook, Log Entries
- Student modules: Games, limited file access
- Shared modules: Chat, Jeopardy, Files (with permissions)

## Next Steps

1. **Run Database Migration**: Execute `file_permissions_migration.sql`
2. **Apply RLS Policies**: Execute `file_permissions_rls.sql`  
3. **Update File UI**: Integrate permission buttons and sharing modals
4. **Test Permissions**: Verify access controls work correctly
5. **Add Bulk Sharing**: Implement sharing with multiple recipients
6. **Enhanced UI**: Add permission management dashboard

## Benefits

### For Teachers
- Easy file sharing with classes
- Granular permission control
- Audit trail of file access
- Microsoft Teams-familiar interface

### For Students  
- Access to shared class materials
- Simplified interface focused on their needs
- Clear permission understanding
- Safe file collaboration

### For System
- Secure file sharing
- Scalable permission model
- Educational context awareness
- Compliance-ready audit trails