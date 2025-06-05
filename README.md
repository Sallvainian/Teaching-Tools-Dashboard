# Teacher Dashboard

A comprehensive web application for educators to manage classroom activities, students, and educational games. Built with modern web technologies focusing on type safety, performance, and user experience.

## 🌟 Features

### Core Functionality
- **Student Management** - Track students across multiple classes and grade levels
- **Gradebook** - Comprehensive grade tracking with bulk operations and analytics
- **Real-time Chat** - Secure messaging system between teachers and students
- **File Management** - Upload, organize, and share educational materials
- **Educational Games** - Interactive Jeopardy and Scattergories games

### Advanced Features
- **Dark/Light Theme** - Automatic theme switching with user preferences
- **Offline Support** - Works offline with localStorage fallback
- **Real-time Sync** - Live updates across multiple devices
- **Data Export** - Export grades and student data
- **Bulk Operations** - Efficient bulk grade entry and file management

## 🛠 Tech Stack

- **Frontend**: SvelteKit 5, TypeScript (strict mode), Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Data Tables**: AG-Grid Community, Handsontable
- **Testing**: Vitest, Testing Library
- **CI/CD**: GitHub Actions, Netlify
- **Error Tracking**: Sentry

## 🏗 Architecture

### Store-Based State Management
The application uses a comprehensive store architecture for scalable state management:

- **`authStore`** - User authentication and session management
- **`settingsStore`** - Theme, preferences, and app configuration
- **`chatStore`** - Real-time messaging with typing indicators
- **`filesStore`** - File upload, organization, and sharing
- **`gradebookStore`** - Grade management with local/cloud sync
- **`uiStore`** - Shared UI state (modals, views, search)

### Service Layer
Clean separation of business logic through dedicated services:

- **`fileService`** - File operations and Supabase storage
- **`supabaseService`** - Database operations with fallbacks
- **`cacheService`** - Performance optimization and offline support

### Database Schema
- **Users & Authentication** - Role-based access (teacher/student)
- **Classes & Students** - Hierarchical class organization
- **Grades & Assignments** - Flexible grading with categories
- **Messages & Conversations** - Real-time chat with participants
- **Files & Folders** - Organized file storage with sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/Sallvainian/Teaching-Tools-Dashboard.git
cd "Teaching-Tools-Dashboard/Svelt Version"

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
The project includes hardcoded development credentials for quick setup. For production, configure:

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 Development

### Essential Commands
```bash
# Development
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production
npm run preview     # Preview production build

# Code Quality (MUST RUN BEFORE COMMIT)
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix linting issues
npm run check       # Run svelte-check for TypeScript
npm run validate    # Run both lint and check

# Testing
npm test            # Run tests with coverage
npm run test:unit   # Run tests in watch mode
```

### Code Standards
- **TypeScript Strict Mode** - No implicit `any`, explicit null checks
- **Svelte 5 Patterns** - Modern runes ($state, $derived, $props)
- **Component Structure** - Imports → Types → Props → State → Effects → Functions → Markup
- **Store Pattern** - Centralized state with actions and derived values

## 📱 Key Features Deep Dive

### Gradebook System
- **Flexible Categories** - Organize assignments by type (homework, tests, etc.)
- **Bulk Grade Entry** - Apply grades to multiple students simultaneously
- **Color-Coded Grading** - Visual grade indicators with customizable schemes
- **PowerTeacher Pro Integration** - Import/export compatibility
- **Real-time Calculations** - Automatic grade averaging and statistics

### Chat System
- **Real-time Messaging** - Instant message delivery with typing indicators
- **Auto-response Bots** - Simulated responses for development/testing
- **Conversation Management** - Group chats and direct messages
- **Message History** - Persistent chat history with search
- **Online Status** - See who's currently active

### File Management
- **Drag & Drop Upload** - Modern file upload with progress tracking
- **Folder Organization** - Hierarchical folder structure
- **File Sharing** - Share files with specific users or classes
- **Preview Support** - Built-in PDF viewer and image preview
- **Trash/Restore** - Soft delete with recovery options

### Educational Games
- **Jeopardy Creator** - Build custom quiz games with categories
- **Scattergories** - Word game with timer and scoring
- **Student Participation** - Real-time game play for students
- **Score Tracking** - Automatic scoring and leaderboards

## 🔧 Recent Updates

### Store Consolidation (Latest)
- Centralized settings management with `settingsStore`
- Shared UI state management with `uiStore`
- Enhanced file operations with bulk actions
- Improved code organization and maintainability

### Chat System Fixes
- Fixed permanent chat deletion with proper RLS policies
- Replaced RPC functions with direct queries for better security
- Enhanced real-time synchronization
- Improved error handling and user feedback

### Gradebook Improvements
- Fixed foreign key constraint issues
- Added bulk grade operations (apply/delete)
- Enhanced grade calculation accuracy
- Improved PowerTeacher Pro compatibility

## 🔒 Security

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Authentication** - Teacher/student access levels
- **Input Validation** - Client and server-side validation
- **Secure File Upload** - Validated file types and sizes
- **HTTPS Only** - Secure communication in production

## 📊 Performance

- **Code Splitting** - Lazy-loaded routes and components
- **Virtual Scrolling** - Efficient handling of large datasets
- **Optimistic Updates** - Immediate UI feedback with rollback
- **Caching Strategy** - Smart caching with cache invalidation
- **Bundle Optimization** - Tree-shaking and compression

## 🤝 Contributing

1. **Code Style** - Follow existing patterns and run `npm run validate`
2. **Testing** - Add tests for new features
3. **Documentation** - Update CLAUDE.md for significant changes
4. **Commits** - Use conventional commit messages

## 📄 License

This project is for educational use. Please respect the learning environment and use responsibly.

## 🆘 Support

- Check **CLAUDE.md** for detailed development guidelines
- Review the codebase architecture in `/src/lib/`
- Test with the included development data
- Use browser dev tools for debugging

---

**Built with ❤️ for educators who make a difference**