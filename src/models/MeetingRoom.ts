import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomImage {
  _id: string;
  fileName: string;
  fileSize: number;
  url: string;
}

export interface IMeetingRoom extends Document {
  _id: string;
  name: string;
  description?: string;
  capacity: number; // seats
  tables: number;
  ac: number;
  washroom: number;
  podium: boolean;
  soundSystem: boolean;
  projector: boolean;
  monitors: number;
  tvs: number;
  ethernet: boolean;
  wifi: boolean;
  images: IRoomImage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomImageSchema = new Schema<IRoomImage>({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  url: { type: String, required: true },
});

const MeetingRoomSchema = new Schema<IMeetingRoom>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    tables: {
      type: Number,
      default: 1,
      min: 0,
    },
    ac: {
      type: Number,
      default: 1,
      min: 0,
    },
    washroom: {
      type: Number,
      default: 1,
      min: 0,
    },
    podium: {
      type: Boolean,
      default: false,
    },
    soundSystem: {
      type: Boolean,
      default: false,
    },
    projector: {
      type: Boolean,
      default: false,
    },
    monitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    tvs: {
      type: Number,
      default: 0,
      min: 0,
    },
    ethernet: {
      type: Boolean,
      default: true,
    },
    wifi: {
      type: Boolean,
      default: true,
    },
    images: [RoomImageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MeetingRoomSchema.index({ name: 1 }, { unique: true });
MeetingRoomSchema.index({ capacity: 1 });
MeetingRoomSchema.index({ wifi: 1, ethernet: 1, projector: 1, soundSystem: 1 });

export default mongoose.models.MeetingRoom || mongoose.model<IMeetingRoom>('MeetingRoom', MeetingRoomSchema);
