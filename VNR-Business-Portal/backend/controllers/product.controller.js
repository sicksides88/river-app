import { supabaseAdmin } from "../config/supabase.js";

// @desc    Get all products (paginated with filters)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      product_type,
      category_id,
      sort = 'created_at:desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(id, name, description, image_url)', { count: 'exact' })
      .eq('status', 'active');

    if (product_type) {
      query = query.eq('product_type', product_type);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Sorting
    const [sortField, sortDirection] = sort.split(':');
    query = query.order(sortField || 'created_at', {
      ascending: sortDirection === 'asc'
    });

    query = query.range(offset, offset + limitNum - 1);

    const { data: products, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      products,
      count: products.length,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, description, image_url)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado"
        });
      }
      throw error;
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message
    });
  }
};

// @desc    Get active categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener categorías",
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = 'created_at:desc' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [sortField, sortDirection] = sort.split(':');

    const { data: products, error, count } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, description, image_url)', { count: 'exact' })
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .order(sortField || 'created_at', { ascending: sortDirection === 'asc' })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      success: true,
      products,
      count: products.length,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por categoría",
      error: error.message
    });
  }
};

// @desc    Search products by name
// @route   GET /api/products/search?q=
// @access  Public
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El parámetro de búsqueda 'q' es requerido"
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { data: products, error, count } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, description, image_url)', { count: 'exact' })
      .eq('status', 'active')
      .ilike('name', `%${q.trim()}%`)
      .order('name', { ascending: true })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      success: true,
      products,
      count: products.length,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error("Error al buscar productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar productos",
      error: error.message
    });
  }
};
