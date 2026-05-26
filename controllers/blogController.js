import Blog from '../models/Blog.js';

export const getAllBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { excerpt: { $regex: escaped, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query).sort({ date: -1 });
    res.json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const blog = isMongoId ? await Blog.findById(id) : await Blog.findOne({ slug: id });

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const related = await Blog.find({ category: blog.category, _id: { $ne: blog._id } })
      .sort({ date: -1 })
      .limit(3)
      .select('title slug excerpt date category');

    const prev = await Blog.findOne({ date: { $lt: blog.date } }).sort({ date: -1 }).select('title slug');
    const next = await Blog.findOne({ date: { $gt: blog.date } }).sort({ date: 1 }).select('title slug');

    res.json({ success: true, blog, related, prev, next });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, category, date, excerpt, content } = req.body;

    if (!title || !category || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const blog = await Blog.create({ title, category, date: date || Date.now(), excerpt, content });

    res.status(201).json({ success: true, message: 'Blog created successfully', blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { title, category, date, excerpt, content } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (title) blog.title = title;
    if (category) blog.category = category;
    if (date) blog.date = date;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;

    await blog.save();

    res.json({ success: true, message: 'Blog updated successfully', blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getBlogStats = async (req, res) => {
  try {
    const total = await Blog.countDocuments();
    const categories = ['Home Loan', 'Education', 'LAP', 'Personal Loan', 'Business Loan', 'Vehicle Loan', 'Tips', 'Finance'];
    const stats = {};

    for (const cat of categories) {
      stats[cat] = await Blog.countDocuments({ category: cat }).catch(() => 0);
    }

    res.json({ success: true, stats: { total, ...stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blog stats' });
  }
};