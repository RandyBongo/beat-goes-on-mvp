# The Beat Goes On - Product Requirements Document

## Original Problem Statement
Build a high-fidelity, dark-themed landing page for "The Beat Goes On," a perpetual blockchain documentary protocol about the story of dance music.

## User Personas
1. **Dance Music Enthusiast** - Wants to explore and learn about dance music history
2. **Documentary Filmmaker** - Wants to contribute footage and become a Pioneer
3. **Cultural Historian** - Researches the evolution of genres and eras
4. **Admin/Foundation** - Manages protocol content and episodes

## Core Requirements
- Hero Section with cinematic headline "The History of Dance Music is No Longer Finished"
- Interactive Timeline Slider with 10 genesis blocks (1960-2026)
- GitHub Logic Cards (Modular Ingestion, Pull Requests, Canonical Versions)
- Pioneer Portal with JWT authentication (first 50 get Genesis status)
- Genre Grid with 100+ documented genres
- Admin Dashboard for content management

## What's Been Implemented (March 2026)
- ✅ Full-stack application (React + FastAPI + MongoDB)
- ✅ JWT authentication with bcrypt password hashing
- ✅ Pioneer badge system (first 50 users get Genesis Pioneer status)
- ✅ Interactive horizontal timeline with framer-motion animations
- ✅ Episode detail modals with full metadata display
- ✅ 10 seed episodes covering 1960-2026 dance music history
- ✅ 103 genres organized by category with search/filter
- ✅ Admin dashboard with CRUD operations for episodes
- ✅ Dark theme with Netflix/Apple TV+ aesthetic
- ✅ Responsive design
- ✅ Glass-morphism navigation with scroll effects

## API Endpoints
- POST /api/auth/signup - User registration
- POST /api/auth/login - User authentication
- GET /api/auth/me - Current user info
- GET /api/auth/pioneer-count - Pioneer spot availability
- GET /api/episodes - List all episodes
- POST /api/episodes - Create episode (admin)
- PUT /api/episodes/:id - Update episode (admin)
- DELETE /api/episodes/:id - Delete episode (admin)
- GET /api/genres - List all genres
- POST /api/seed - Seed initial data

## Prioritized Backlog
### P0 (Critical)
- None - MVP complete

### P1 (High Priority)
- Episode contribution submission workflow
- Video upload integration (IPFS)
- Community voting on contributions

### P2 (Medium Priority)
- Advanced genre filtering and relationships
- User profile pages with contribution history
- Email verification for signup
- Password reset functionality

### P3 (Nice to Have)
- Real-time notifications for contribution updates
- Multi-language support
- Mobile native app version
- Blockchain transaction recording

## Next Tasks
1. Implement contribution submission form for community footage
2. Add video preview/player for episode content
3. Build community voting system for pull requests
4. Integrate IPFS for decentralized storage
5. Add email notifications for pioneer milestones
