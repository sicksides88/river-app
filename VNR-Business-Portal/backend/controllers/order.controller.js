import { supabaseAdmin } from "../config/supabase.js";

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      items,
      coupon_code,
      shipping_street,
      shipping_number,
      shipping_floor,
      shipping_postal_code,
      shipping_neighborhood,
      shipping_city,
      shipping_province,
      shipping_cost = 0,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La orden debe tener al menos un producto"
      });
    }

    // Generate order number: VNR-YYYYMMDD-XXXXX
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const orderNumber = `VNR-${datePart}-${randomPart}`;

    // Fetch products by IDs
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'active');

    if (productsError) throw productsError;

    // Validate all products exist and are active
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({
        success: false,
        message: "Algunos productos no están disponibles",
        missingIds
      });
    }

    // Validate stock and calculate subtotal
    const productMap = {};
    for (const product of products) {
      productMap[product.id] = product;
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productMap[item.product_id];

      if (product.stock !== null && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        });
      }

      const unitPrice = product.promotional_price || product.base_price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total: itemTotal
      });
    }

    // Validate and apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .single();

      if (couponError || !coupon) {
        return res.status(400).json({
          success: false,
          message: "Cupón no válido"
        });
      }

      // Validate coupon
      if (coupon.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: "Este cupón no está activo"
        });
      }

      const nowDate = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < nowDate) {
        return res.status(400).json({
          success: false,
          message: "Este cupón ha expirado"
        });
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return res.status(400).json({
          success: false,
          message: "Este cupón ha alcanzado su límite de usos"
        });
      }

      if (coupon.min_cart_amount && subtotal < coupon.min_cart_amount) {
        return res.status(400).json({
          success: false,
          message: `El monto mínimo para usar este cupón es $${coupon.min_cart_amount}`
        });
      }

      // Calculate discount
      if (coupon.discount_type === 'percentage') {
        discount = Math.round((subtotal * coupon.discount_value) / 100);
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = coupon.discount_value;
      }

      if (discount > subtotal) {
        discount = subtotal;
      }

      appliedCoupon = coupon;
    }

    const totalAmount = subtotal - discount + shipping_cost;

    // Insert order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        subtotal,
        discount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        shipping_cost,
        total: totalAmount,
        shipping_street,
        shipping_number,
        shipping_floor,
        shipping_postal_code,
        shipping_neighborhood,
        shipping_city,
        shipping_province,
        notes,
        customer_name: req.user.nombre || req.user.email,
        customer_lastname: req.user.apellido || '',
        customer_email: req.user.email,
        customer_phone: req.user.telefono_numero || null
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Decrement stock for each product
    for (const item of items) {
      const product = productMap[item.product_id];
      if (product.stock !== null) {
        await supabaseAdmin
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // Increment coupon usage
    if (appliedCoupon) {
      await supabaseAdmin
        .from('coupons')
        .update({ current_uses: (appliedCoupon.current_uses || 0) + 1 })
        .eq('id', appliedCoupon.id);
    }

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json({
      success: true,
      message: "Orden creada exitosamente",
      order: completeOrder
    });
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la orden",
      error: error.message
    });
  }
};

// @desc    Get user orders (paginated)
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      orders,
      count: orders.length,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener órdenes",
      error: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: "Orden no encontrada"
        });
      }
      throw error;
    }

    // Verify the order belongs to the user
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver esta orden"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener orden",
      error: error.message
    });
  }
};
