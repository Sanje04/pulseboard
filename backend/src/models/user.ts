import mongoose, { Document, Schema } from 'mongoose';

/**
 * TypeScript interface for User document
 * Provides compile-time type safety
 */
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for User
 * Provides runtime validation and database constraints
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

/**
 * User model
 * Export for use in controllers and services
 */
export const User = mongoose.model<IUser>('User', userSchema);
