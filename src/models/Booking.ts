import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReschedule {
  requestedBy: Types.ObjectId;
  roomId?: string;
  date?: string;
  startMinutes?: number;
  endMinutes?: number;
  requestedAt: Date;
}

export interface IBooking extends Document {
  _id: string;
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD format
  startMinutes: number; // minutes since midnight
  endMinutes: number; // minutes since midnight
  purpose?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'RESCHEDULE_REQUESTED';
  reschedule?: IReschedule;
  cancelReason?: string;
  rejectReason?: string;
  createdByRole: 'ADMIN' | 'STAFF' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

const RescheduleSchema = new Schema<IReschedule>({
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'MeetingRoom',
  },
  date: {
    type: String,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  startMinutes: {
    type: Number,
    min: 0,
    max: 1439, // 23:59
  },
  endMinutes: {
    type: Number,
    min: 0,
    max: 1439, // 23:59
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

const BookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'MeetingRoom',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    startMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439, // 23:59
    },
    endMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439, // 23:59
    },
    purpose: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'RESCHEDULE_REQUESTED'],
      default: 'PENDING',
      required: true,
    },
    reschedule: RescheduleSchema,
    cancelReason: {
      type: String,
      trim: true,
    },
    rejectReason: {
      type: String,
      trim: true,
    },
    createdByRole: {
      type: String,
      enum: ['ADMIN', 'STAFF', 'USER'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ roomId: 1, date: 1, startMinutes: 1 });
BookingSchema.index({ userId: 1, date: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
