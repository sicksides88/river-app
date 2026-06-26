import { supabaseAdmin } from "../config/supabase.js";

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "El código de cupón es requerido"
      });
    }

    const validation = await _validateCoupon(code, cartTotal, userId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    res.json({
      success: true,
      message: "Cupón válido",
      coupon: {
        code: validation.coupon.code,
        discount_type: validation.coupon.discount_type,
        discount_value: validation.coupon.discount_value,
        description: validation.coupon.description
      }
    });
  } catch (error) {
    console.error("Error al validar cupón:", error);
    res.status(500).json({
      success: false,
      message: "Error al validar cupón",
      error: error.message
    });
  }
};

// @desc    Apply a coupon and calculate discount
// @route   POST /api/coupons/apply
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal, shippingCost = 0 } = req.body;
    const userId = req.user.id;

    if (!code || cartTotal === undefined) {
      return res.status(400).json({
        success: false,
        message: "El código de cupón y el total del carrito son requeridos"
      });
    }

    const validation = await _validateCoupon(code, cartTotal, userId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const coupon = validation.coupon;
    let discount = 0;

    if (coupon.discount_type === 'percentage') {
      discount = Math.round((cartTotal * coupon.discount_value) / 100);
      // Apply max discount if defined
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      // Fixed amount
      discount = coupon.discount_value;
    }

    // Discount cannot exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    const finalTotal = cartTotal - discount + shippingCost;

    res.json({
      success: true,
      message: "Cupón aplicado correctamente",
      data: {
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount,
        originalTotal: cartTotal,
        shippingCost,
        finalTotal
      }
    });
  } catch (error) {
    console.error("Error al aplicar cupón:", error);
    res.status(500).json({
      success: false,
      message: "Error al aplicar cupón",
      error: error.message
    });
  }
};

// Helper: validate coupon logic
async function _validateCoupon(code, cartTotal, userId) {
  // Fetch coupon by code
  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !coupon) {
    return { valid: false, message: "Cupón no encontrado" };
  }

  // Check status
  if (coupon.status !== 'active') {
    return { valid: false, message: "Este cupón no está activo" };
  }

  // Check dates
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, message: "Este cupón aún no está vigente" };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, message: "Este cupón ha expirado" };
  }

  // Check global usage limit
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, message: "Este cupón ha alcanzado su límite de usos" };
  }

  // Check minimum cart amount
  if (coupon.min_cart_amount && cartTotal < coupon.min_cart_amount) {
    return {
      valid: false,
      message: `El monto mínimo para usar este cupón es $${coupon.min_cart_amount}`
    };
  }

  // Check first purchase only
  if (coupon.first_purchase_only) {
    const { count } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count > 0) {
      return { valid: false, message: "Este cupón es solo para la primera compra" };
    }
  }

  return { valid: true, coupon };
}
