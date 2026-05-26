import mongoose from 'mongoose';

const AVG_READING_SPEED = 200;

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
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  author: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  coverImage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  readTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

blogSchema.pre('save', async function(next) {
  if (this.isModified('content')) {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / AVG_READING_SPEED));
  }

  if (this.isModified('title') || !this.slug) {
    let baseSlug = (this.slug || this.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'post';
    let slug = baseSlug;
    let counter = 2;
    const existing = await mongoose.model('Blog').findOne({ slug, _id: { $ne: this._id } }).exec();
    if (existing) {
      while (await mongoose.model('Blog').findOne({ slug, _id: { $ne: this._id } }).exec()) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    this.slug = slug;
  }
  next();
});

blogSchema.index({ category: 1 });
blogSchema.index({ date: -1 });
blogSchema.index({ tags: 1 });

export default mongoose.model('Blog', blogSchema);