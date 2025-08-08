# RFL Meeting Room Booking & Management System

This is a comprehensive Meeting Room Booking & Management System developed using Next.js 14 (App Router), TypeScript, MongoDB, Tailwind CSS, and JWT for authentication. The system features both a user-facing panel for booking and managing meeting rooms, and an admin panel for managing users, meeting rooms, and bookings.

## Features

### User Panel

- User authentication (login, logout)
- Dashboard with upcoming bookings
- Browse available meeting rooms with details and amenities
- Book meeting rooms with a step-by-step wizard
- View, reschedule, and cancel personal bookings
- Booking history
- Responsive design for mobile and desktop
- Dark/Light theme toggle

### Admin Panel

- Admin/Staff authentication
- Dashboard with system statistics (total users, rooms, bookings, pending bookings)
- User management (CRUD operations, password reset)
- Meeting room management (CRUD operations, image uploads/deletion)
- Booking management (confirm, reject, approve/reject reschedule requests)
- Manual booking creation for users
- Admin booking history
- Responsive design and consistent UI

## Technologies Used

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js, TypeScript
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT), `bcrypt` for password hashing
- **Validation:** `zod`
- **Image Storage:** Local file system (can be extended to cloud storage like AWS S3)
- **Utilities:** `date-fns` for date manipulation, `multer` for file uploads

## Project Structure

```
rfl-booking-system/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/                # API routes
│   │   │   ├── admin/
│   │   │   │   ├── bookings/
│   │   │   │   ├── meeting-rooms/
│   │   │   │   └── users/
│   │   │   └── auth/
│   │   ├── admin/              # Admin panel pages
│   │   │   ├── booking/
│   │   │   ├── bookings/
│   │   │   ├── dashboard/
│   │   │   ├── history/
│   │   │   ├── meeting-rooms/
│   │   │   └── users/
│   │   ├── booking/            # User booking pages
│   │   ├── history/
│   │   ├── login/
│   │   ├── meeting-rooms/
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable React components
│   │   ├── AdminLayout.tsx
│   │   ├── Layout.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/                    # Utility functions and configurations
│   │   ├── admin-api.ts        # Admin API client
│   │   ├── api.ts              # User API client
│   │   ├── auth-context.tsx    # Authentication context
│   │   ├── auth.ts             # JWT authentication utilities
│   │   ├── db.ts               # MongoDB connection
│   │   ├── middleware/         # API middleware
│   │   ├── services/           # Backend services (e.g., booking overlap logic)
│   │   ├── utils/              # General utilities (time, file)
│   │   └── validators/         # Zod schemas for validation
│   └── models/                 # MongoDB Mongoose models
│       ├── Booking.ts
│       ├── MeetingRoom.ts
│       └── User.ts
├── .env.example                # Example environment variables
├── .env.local                  # Local environment variables (ignored by Git)
├── package.json                # Project dependencies and scripts
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd rfl-booking-system
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory of the project and add the following environment variables:

    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
    ```

    - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/rfl_booking_system` or a MongoDB Atlas URI).
    - `JWT_SECRET`: A strong, random string for JWT signing. You can generate one using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
    - `NEXT_PUBLIC_API_BASE_URL`: The base URL for your API (use `http://localhost:3000` for local development).

4.  **Start MongoDB:**
    Make sure MongoDB is running on your system. If using MongoDB Atlas, ensure your connection string is correct.

5.  **Run the development server:**

    ```bash
    npm run dev
    ```

6.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Default Admin Account

For initial setup, you can create an admin account by directly inserting into the MongoDB database or by modifying the user creation API temporarily. Here's an example admin user:

```javascript
{
    "user": {
        "id": "6893906b04cb6c20c064fc0f",
        "email": "admin@rfl.com",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2025-08-06T17:27:07.300Z"
    },
    "generatedPassword": "9lvweITKL!gw",
    "message": "User created successfully"
}
{
    "user": {
        "id": "689396f104cb6c20c064fc95",
        "email": "jesan.qtec@gmail.com",
        "role": "USER",
        "isActive": true,
        "createdAt": "2025-08-06T17:35:07.300Z"
    },
    "generatedPassword": "GejVqluynlml",
    "message": "User created successfully"
}
```

## API Documentation

The system provides comprehensive REST APIs for all operations:

### Authentication APIs

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### User APIs (Public)

- `GET /api/meeting-rooms` - Get all meeting rooms
- `GET /api/meeting-rooms/[id]` - Get meeting room details
- `GET /api/meeting-rooms/[id]/booked-slots` - Get booked slots for a room
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Delete booking
- `POST /api/bookings/[id]/cancel` - Cancel booking
- `POST /api/bookings/[id]/reschedule` - Request reschedule

### Admin APIs

- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/users/[id]/reset-password` - Reset user password
- `GET /api/admin/meeting-rooms` - Get all meeting rooms (admin)
- `POST /api/admin/meeting-rooms` - Create meeting room
- `PATCH /api/admin/meeting-rooms/[id]` - Update meeting room
- `DELETE /api/admin/meeting-rooms/[id]` - Delete meeting room
- `POST /api/admin/meeting-rooms/[id]/images` - Upload room images
- `DELETE /api/admin/meeting-rooms/[id]/images/[imageId]` - Delete room image
- `GET /api/admin/bookings` - Get all bookings (admin)
- `POST /api/admin/bookings` - Create booking (admin)
- `POST /api/admin/bookings/[id]/confirm` - Confirm booking
- `POST /api/admin/bookings/[id]/reject` - Reject booking
- `POST /api/admin/bookings/[id]/approve-reschedule` - Approve reschedule
- `POST /api/admin/bookings/[id]/reject-reschedule` - Reject reschedule

## Database Schema

### User Model

```typescript
{
  email: string(unique);
  password: string(hashed);
  role: 'ADMIN' | 'STAFF' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}
```

### MeetingRoom Model

```typescript
{
  name: string
  description?: string
  capacity: number
  tables: number
  ac: number
  washroom: number
  podium: boolean
  soundSystem: boolean
  projector: boolean
  monitors: number
  tvs: number
  ethernet: boolean
  wifi: boolean
  images: Array<{
    _id: ObjectId
    fileName: string
    url: string
  }>
  createdAt: Date
  updatedAt: Date
}
```

### Booking Model

```typescript
{
  roomId: ObjectId (ref: MeetingRoom)
  userId: ObjectId (ref: User)
  date: Date
  startMinutes: number
  endMinutes: number
  purpose?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'RESCHEDULE_REQUESTED'
  reschedule?: {
    requestedBy: ObjectId
    roomId?: ObjectId
    date?: Date
    startMinutes?: number
    endMinutes?: number
    requestedAt: Date
  }
  cancelReason?: string
  rejectReason?: string
  createdByRole: 'ADMIN' | 'STAFF' | 'USER'
  createdAt: Date
  updatedAt: Date
}
```

## Key Features Implementation

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (ADMIN, STAFF, USER)
- Protected routes and API endpoints
- Persistent login state with context management

### Booking System

- Overlap detection to prevent double bookings
- Time slot validation
- Booking status management (pending, confirmed, cancelled, etc.)
- Reschedule request workflow
- Admin approval/rejection system

### File Upload

- Image upload for meeting rooms
- File validation and storage
- Image deletion functionality
- Support for multiple image formats

### Responsive Design

- Mobile-first approach
- Dark/Light theme toggle
- Consistent UI across user and admin panels
- Touch-friendly interface for mobile devices

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Make sure to set the following environment variables in your production environment:

- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_BASE_URL`

### Deployment Platforms

This application can be deployed on:

- Vercel (recommended for Next.js)
- Netlify
- AWS
- DigitalOcean
- Any Node.js hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
