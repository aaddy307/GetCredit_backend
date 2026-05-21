const mongoose = require('mongoose');

const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['Home Loan', 'Education', 'LAP', 'Personal Loan', 'Business Loan', 'Vehicle Loan', 'Tips', 'Finance']
  },
  date: {
    type: Date,
    default: Date.now
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000
  }
}, {
  timestamps: true
});

blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (this.isModified('content')) {
    this.content = stripHtml(this.content);
  }
  next();
});

blogSchema.index({ category: 1 });
blogSchema.index({ date: -1 });

module.exports = mongoose.model('Blog', blogSchema);