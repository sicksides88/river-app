import { supabaseAdmin } from '../config/supabase.js';
import walletService from '../services/wallet.service.js';

// @desc    Obtener wallet del usuario
// @route   GET /api/wallet
// @access  Private
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await walletService.getWallet(userId);

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        isActive: wallet.is_active,
        isBlocked: wallet.is_blocked,
        blockedReason: wallet.blocked_reason,
      },
    });
  } catch (error) {
    console.error('Error obteniendo wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo wallet',
      error: error.message,
    });
  }
};

// @desc    Obtener solo el saldo
// @route   GET /api/wallet/balance
// @access  Private
export const getBalance = async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.user.id);

    res.json({
      success: true,
      ...balance,
    });
  } catch (error) {
    console.error('Error obteniendo saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo saldo',
      error: error.message,
    });
  }
};

// @desc    Iniciar recarga de saldo
// @route   POST /api/wallet/deposit
// @access  Private
export const initiateDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Monto minimo de recarga: $100',
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Monto maximo de recarga: $50,000',
      });
    }

    const deposit = await walletService.initiateDeposit(userId, amount);

    res.status(201).json({
      success: true,
      message: 'Recarga iniciada',
      ...deposit,
    });
  } catch (error) {
    console.error('Error iniciando recarga:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error iniciando recarga',
    });
  }
};

// @desc    Confirmar deposito (callback de MercadoPago)
// @route   POST /api/wallet/deposit/confirm
// @access  Public
export const confirmDeposit = async (req, res) => {
  try {
    const { paymentId, mpPaymentId, status } = req.body;

    if (status !== 'approved') {
      return res.json({
        success: false,
        message: 'Pago no aprobado',
        status,
      });
    }

    const result = await walletService.confirmDeposit(paymentId, mpPaymentId);

    res.json({
      success: true,
      message: 'Recarga confirmada',
      ...result,
    });
  } catch (error) {
    console.error('Error confirmando deposito:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirmando deposito',
      error: error.message,
    });
  }
};

// @desc    Solicitar retiro de saldo
// @route   POST /api/wallet/withdraw
// @access  Private
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Monto minimo de retiro: $500',
      });
    }

    if (!bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una cuenta bancaria',
      });
    }

    const withdrawal = await walletService.requestWithdrawal(userId, amount, bankAccountId);

    res.status(201).json({
      success: true,
      message: 'Solicitud de retiro creada',
      ...withdrawal,
    });
  } catch (error) {
    console.error('Error solicitando retiro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error solicitando retiro',
    });
  }
};

// @desc    Obtener historial de transacciones
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    const result = await walletService.getTransactions(userId, { page, limit, type });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message,
    });
  }
};

// @desc    Obtener detalle de una transaccion
// @route   GET /api/wallet/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: transaction, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaccion no encontrada',
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error obteniendo transaccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transaccion',
      error: error.message,
    });
  }
};

// =====================================================
// CUENTAS BANCARIAS
// =====================================================

// @desc    Obtener cuentas bancarias del usuario
// @route   GET /api/wallet/bank-accounts
// @access  Private
export const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: accounts, error } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      accounts: accounts.map(account => ({
        id: account.id,
        bankName: account.bank_name,
        accountType: account.account_type,
        alias: account.alias,
        cbuLastDigits: account.cbu?.slice(-4),
        holderName: account.holder_name,
        isVerified: account.is_verified,
        isDefault: account.is_default,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo cuentas bancarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cuentas bancarias',
      error: error.message,
    });
  }
};

// @desc    Agregar cuenta bancaria
// @route   POST /api/wallet/bank-accounts
// @access  Private
export const addBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bankName,
      accountType,
      accountNumber,
      cbu,
      alias,
      holderName,
      holderCuit,
    } = req.body;

    // Validaciones
    if (!bankName || !accountType || !holderName) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    if (!cbu && !alias) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere CBU o Alias',
      });
    }

    // Validar CBU (22 digitos)
    if (cbu && !/^\d{22}$/.test(cbu)) {
      return res.status(400).json({
        success: false,
        message: 'CBU invalido. Debe tener 22 digitos',
      });
    }

    // Verificar si es la primera cuenta (sera default)
    const { data: existingAccounts } = await supabaseAdmin
      .from('bank_accounts')
      .select('id')
      .eq('user_id', userId);

    const isDefault = !existingAccounts || existingAccounts.length === 0;

    const { data: account, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert({
        user_id: userId,
        bank_name: bankName,
        account_type: accountType,
        account_number: accountNumber,
        cbu,
        alias,
        holder_name: holderName,
        holder_cuit: holderCuit,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Cuenta bancaria agregada',
      account: {
        id: account.id,
        bankName: account.bank_name,
        accountType: account.account_type,
        alias: account.alias,
        cbuLastDigits: account.cbu?.slice(-4),
        holderName: account.holder_name,
        isDefault: account.is_default,
      },
    });
  } catch (error) {
    console.error('Error agregando cuenta bancaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando cuenta bancaria',
      error: error.message,
    });
  }
};

// @desc    Eliminar cuenta bancaria
// @route   DELETE /api/wallet/bank-accounts/:id
// @access  Private
export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cuenta bancaria eliminada',
    });
  } catch (error) {
    console.error('Error eliminando cuenta bancaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando cuenta bancaria',
      error: error.message,
    });
  }
};

// @desc    Establecer cuenta bancaria por defecto
// @route   PUT /api/wallet/bank-accounts/:id/default
// @access  Private
export const setDefaultBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Quitar default de todas las cuentas
    await supabaseAdmin
      .from('bank_accounts')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Establecer nueva cuenta por defecto
    const { data: account, error } = await supabaseAdmin
      .from('bank_accounts')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cuenta bancaria establecida como predeterminada',
      account: {
        id: account.id,
        bankName: account.bank_name,
        isDefault: account.is_default,
      },
    });
  } catch (error) {
    console.error('Error estableciendo cuenta por defecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error estableciendo cuenta por defecto',
      error: error.message,
    });
  }
};

// =====================================================
// MÉTODOS DE PAGO GUARDADOS
// =====================================================

// @desc    Obtener métodos de pago guardados del usuario
// @route   GET /api/wallet/payment-methods
// @access  Private
export const getSavedPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: methods, error } = await supabaseAdmin
      .from('saved_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      paymentMethods: (methods || []).map(method => ({
        id: method.id,
        paymentType: method.payment_type,
        cardLastFour: method.card_last_four,
        cardBrand: method.card_brand,
        cardExpiryMonth: method.card_expiry_month,
        cardExpiryYear: method.card_expiry_year,
        cardholderName: method.cardholder_name,
        isDefault: method.is_default,
        isVerified: method.is_verified,
        createdAt: method.created_at,
        lastUsedAt: method.last_used_at,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métodos de pago',
      error: error.message,
    });
  }
};

// @desc    Agregar método de pago (tarjeta)
// @route   POST /api/wallet/payment-methods
// @access  Private
export const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      paymentType,
      cardNumber,
      // Aceptar ambos formatos de nombres de campos
      cardExpiryMonth,
      cardExpiryYear,
      expiryMonth,
      expiryYear,
      cardholderName,
      cvv,
      securityCode,
      mpCardToken,
      mpPaymentMethodId,
    } = req.body;

    // Mapear campos (aceptar ambos formatos)
    const finalExpiryMonth = cardExpiryMonth || expiryMonth;
    const finalExpiryYear = cardExpiryYear || expiryYear;
    const finalCvv = cvv || securityCode;

    // Validaciones básicas
    if (!paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pago requerido',
      });
    }

    if (paymentType === 'card' || paymentType === 'debit_card') {
      // Validar datos de tarjeta
      if (!cardNumber || !finalExpiryMonth || !finalExpiryYear || !cardholderName) {
        return res.status(400).json({
          success: false,
          message: 'Datos de tarjeta incompletos',
        });
      }

      // Validar número de tarjeta (solo los últimos 4 dígitos se guardan)
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanCardNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Número de tarjeta inválido',
        });
      }

      // Validar fecha de expiración
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      const parsedExpiryYear = parseInt(finalExpiryYear);
      const parsedExpiryMonth = parseInt(finalExpiryMonth);

      // Soportar año en formato YYYY o YY
      const yearToCheck = parsedExpiryYear > 100 ? parsedExpiryYear % 100 : parsedExpiryYear;
      if (yearToCheck < currentYear || (yearToCheck === currentYear && parsedExpiryMonth < currentMonth)) {
        return res.status(400).json({
          success: false,
          message: 'La tarjeta está vencida',
        });
      }

      // Detectar marca de tarjeta
      const cardBrand = detectCardBrand(cleanCardNumber);

      // Obtener últimos 4 dígitos
      const lastFour = cleanCardNumber.slice(-4);

      // Verificar si es la primera tarjeta (será default)
      const { data: existingMethods } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const isDefault = !existingMethods || existingMethods.length === 0;

      // Guardar método de pago (nunca guardamos el número completo ni CVV)
      const { data: method, error } = await supabaseAdmin
        .from('saved_payment_methods')
        .insert({
          user_id: userId,
          payment_type: paymentType,
          card_last_four: lastFour,
          card_brand: cardBrand,
          card_expiry_month: parsedExpiryMonth,
          card_expiry_year: parsedExpiryYear,
          cardholder_name: cardholderName,
          mp_card_token_id: mpCardToken || null,
          mp_payment_method_id: mpPaymentMethodId || cardBrand,
          is_default: isDefault,
          is_verified: true, // Asumimos verificado para simplificar
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Método de pago agregado exitosamente',
        paymentMethod: {
          id: method.id,
          paymentType: method.payment_type,
          cardLastFour: method.card_last_four,
          cardBrand: method.card_brand,
          cardExpiryMonth: method.card_expiry_month,
          cardExpiryYear: method.card_expiry_year,
          cardholderName: method.cardholder_name,
          isDefault: method.is_default,
        },
      });
    } else if (paymentType === 'mercadopago') {
      // Para MercadoPago, solo guardamos referencia
      const { data: existingMethods } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const isDefault = !existingMethods || existingMethods.length === 0;

      const { data: method, error } = await supabaseAdmin
        .from('saved_payment_methods')
        .insert({
          user_id: userId,
          payment_type: 'mercadopago',
          mp_payment_method_id: 'account_money',
          is_default: isDefault,
          is_verified: true,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'MercadoPago vinculado exitosamente',
        paymentMethod: {
          id: method.id,
          paymentType: method.payment_type,
          isDefault: method.is_default,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pago no soportado',
      });
    }
  } catch (error) {
    console.error('Error agregando método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando método de pago',
      error: error.message,
    });
  }
};

// @desc    Eliminar método de pago
// @route   DELETE /api/wallet/payment-methods/:id
// @access  Private
export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Soft delete - cambiar status a 'deleted'
    const { data: method, error } = await supabaseAdmin
      .from('saved_payment_methods')
      .update({ status: 'deleted', is_default: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado',
      });
    }

    // Si era el default, establecer otro como default
    if (method.is_default) {
      const { data: nextMethod } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (nextMethod) {
        await supabaseAdmin
          .from('saved_payment_methods')
          .update({ is_default: true })
          .eq('id', nextMethod.id);
      }
    }

    res.json({
      success: true,
      message: 'Método de pago eliminado',
    });
  } catch (error) {
    console.error('Error eliminando método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando método de pago',
      error: error.message,
    });
  }
};

// @desc    Establecer método de pago por defecto
// @route   PUT /api/wallet/payment-methods/:id/default
// @access  Private
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Quitar default de todos los métodos
    await supabaseAdmin
      .from('saved_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Establecer nuevo método por defecto
    const { data: method, error } = await supabaseAdmin
      .from('saved_payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Método de pago establecido como predeterminado',
      paymentMethod: {
        id: method.id,
        paymentType: method.payment_type,
        cardLastFour: method.card_last_four,
        cardBrand: method.card_brand,
        isDefault: method.is_default,
      },
    });
  } catch (error) {
    console.error('Error estableciendo método de pago por defecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error estableciendo método de pago por defecto',
      error: error.message,
    });
  }
};

// Helper: Detectar marca de tarjeta
function detectCardBrand(cardNumber) {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2[2-7]/,
    amex: /^3[47]/,
    diners: /^3(?:0[0-5]|[68])/,
    discover: /^6(?:011|5)/,
    jcb: /^(?:2131|1800|35)/,
    maestro: /^(5018|5020|5038|6304|6759|676[1-3])/,
    cabal: /^(6042|6043|6044|6045|6046|5896)/,
    naranja: /^(589562)/,
  };

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return brand;
    }
  }

  return 'unknown';
}
