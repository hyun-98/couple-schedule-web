const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    couple: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

scheduleSchema.pre('validate', function validateDates(next) {
  if (this.endAt && this.startAt && this.endAt < this.startAt) {
    this.invalidate('endAt', 'endAt must be after startAt');
  }
  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);
