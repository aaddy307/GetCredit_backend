const Blog = require('../models/Blog');

exports.getAllBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query).sort({ date: -1 });
    res.json({
      success: true,
      count: blogs.length,
      blogs
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const blog = isMongoId ? await Blog.findById(id) : await Blog.findOne({ slug: id });
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    // Get related posts (same category, excluding current)
    const related = await Blog.find({ category: blog.category, _id: { $ne: blog._id } })
      .sort({ date: -1 })
      .limit(3)
      .select('title slug excerpt date category');
    
    // Get previous and next posts
    const prev = await Blog.findOne({ date: { $lt: blog.date } }).sort({ date: -1 }).select('title slug');
    const next = await Blog.findOne({ date: { $gt: blog.date } }).sort({ date: 1 }).select('title slug');
    
    res.json({
      success: true,
      blog,
      related,
      prev,
      next
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, category, date, excerpt, content } = req.body;

    if (!title || !category || !excerpt || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const blog = await Blog.create({
      title,
      category,
      date: date || Date.now(),
      excerpt,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
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
    
    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBlogStats = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const total = await Blog.countDocuments();
    const categories = ['Home Loan', 'Education', 'LAP', 'Tips', 'Finance'];
    const stats = {};

    for (const cat of categories) {
      stats[cat] = await Blog.countDocuments({ category: cat }).catch(err => {
        console.error(`Error counting ${cat}:`, err);
        return 0;
      });
    }

    res.json({
      success: true,
      stats: {
        total,
        ...stats
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog stats' });
  }
};