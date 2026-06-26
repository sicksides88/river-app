import { supabaseAdmin } from "../config/supabase.js";

const POLICY_BUCKET = "policy-documents";

const MEMBERSHIP_SELECT =
  "link_type, onboarding_completed, membership_skipped, insurance_company, policy_number, policy_expiry_date, policy_document_url, account_holder, account_type, cbu, bank_name, billing_preference, subscription_plan, subscription_billing_cycle, subscription_expires_at";

const VALID_PLAN_IDS = new Set(["bronce", "plata", "premium"]);
const VALID_BILLING_CYCLES = new Set(["annual", "monthly"]);

const computeSubscriptionExpiry = (billingCycle) => {
  const date = new Date();
  if (billingCycle === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const membershipSchemaError = (error) => {
  if (error?.code === "PGRST204") {
    return {
      status: 500,
      message:
        "Falta una columna en profiles (ej. cuit_cuil). Ejecutá river_service_all_patches.sql en Supabase SQL Editor.",
    };
  }
  if (error?.code === "22001") {
    return {
      status: 400,
      message:
        "Un valor es demasiado largo para la columna en la base de datos. Ejecutá river_service_cbu_patch.sql en Supabase SQL Editor.",
    };
  }
  return null;
};

const mapMembership = (profile) => ({
  link_type: profile.link_type || "independiente",
  onboarding_completed: profile.onboarding_completed || false,
  membership_skipped: profile.membership_skipped || false,
  insurance_company: profile.insurance_company || null,
  policy_number: profile.policy_number || null,
  policy_expiry_date: profile.policy_expiry_date || null,
  policy_document_url: profile.policy_document_url || null,
  account_holder: profile.account_holder || null,
  account_type: profile.account_type || null,
  cbu: profile.cbu || null,
  bank_name: profile.bank_name || null,
  billing_preference: profile.billing_preference || null,
  subscription_plan: profile.subscription_plan || "bronce",
  subscription_billing_cycle: profile.subscription_billing_cycle || "annual",
  subscription_expires_at: profile.subscription_expires_at || null,
});

async function ensurePolicyBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === POLICY_BUCKET)) {
    await supabaseAdmin.storage.createBucket(POLICY_BUCKET, {
      public: false,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
    });
  }
}

async function uploadPolicyDocument(userId, fileData, fileName = "poliza") {
  if (!fileData) return null;
  await ensurePolicyBucket();

  const isPdf = fileData.includes("application/pdf") || fileName?.endsWith(".pdf");
  const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const ext = isPdf ? "pdf" : "jpg";
  const path = `${userId}/policy_${Date.now()}.${ext}`;
  const contentType = isPdf ? "application/pdf" : "image/jpeg";

  const { error } = await supabaseAdmin.storage
    .from(POLICY_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabaseAdmin.storage.from(POLICY_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

export const getMembership = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(MEMBERSHIP_SELECT)
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(profile || {}) });
  } catch (error) {
    console.error("getMembership:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setLinkType = async (req, res) => {
  try {
    const { link_type } = req.body;
    if (!["aseguradora", "independiente"].includes(link_type)) {
      return res.status(400).json({ success: false, message: "link_type inválido" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ link_type, updated_at: new Date().toISOString() })
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("setLinkType:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAseguradora = async (req, res) => {
  try {
    const { insurance_company, policy_number, policy_expiry_date, policy_file_base64, policy_file_name, skipped } =
      req.body;

    if (!skipped) {
      if (!insurance_company?.trim() || !policy_number?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Compañía y nº de póliza son obligatorios",
        });
      }
    }

    const updateData = {
      link_type: "aseguradora",
      membership_skipped: Boolean(skipped),
      updated_at: new Date().toISOString(),
    };

    if (!skipped) {
      updateData.insurance_company = insurance_company.trim();
      updateData.policy_number = policy_number.trim();
      updateData.policy_expiry_date = policy_expiry_date?.trim() || null;
      if (policy_file_base64) {
        updateData.policy_document_url = await uploadPolicyDocument(
          req.user.id,
          policy_file_base64,
          policy_file_name
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("saveAseguradora:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveIndependiente = async (req, res) => {
  try {
    const {
      account_holder,
      account_type,
      cuil_cuit,
      cbu,
      bank_name,
      billing_preference,
      skipped,
    } = req.body;

    const updateData = {
      link_type: "independiente",
      membership_skipped: Boolean(skipped),
      updated_at: new Date().toISOString(),
    };

    if (!skipped) {
      if (!account_holder?.trim() || !cbu?.trim() || !bank_name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Titular, CBU y banco son obligatorios",
        });
      }
      updateData.account_holder = account_holder.trim();
      updateData.account_type = account_type?.trim() || null;
      updateData.cbu = String(cbu).replace(/\D/g, "");
      updateData.bank_name = bank_name.trim();
      updateData.billing_preference = billing_preference?.trim() || null;
      if (cuil_cuit) {
        updateData.cuit_cuil = String(cuil_cuit).replace(/\D/g, "");
      }
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("saveIndependiente:", error);
    const schemaErr = membershipSchemaError(error);
    if (schemaErr) {
      return res.status(schemaErr.status).json({ success: false, message: schemaErr.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("completeOnboarding:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setSubscription = async (req, res) => {
  try {
    const { plan_id, billing_cycle } = req.body;
    const planId = String(plan_id || "").toLowerCase();
    const cycle = String(billing_cycle || "annual").toLowerCase();

    if (!VALID_PLAN_IDS.has(planId)) {
      return res.status(400).json({ success: false, message: "plan_id inválido" });
    }
    if (!VALID_BILLING_CYCLES.has(cycle)) {
      return res.status(400).json({ success: false, message: "billing_cycle inválido" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_plan: planId,
        subscription_billing_cycle: cycle,
        subscription_expires_at: computeSubscriptionExpiry(cycle),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("setSubscription:", error);
    const schemaErr = membershipSchemaError(error);
    if (schemaErr) {
      return res.status(schemaErr.status).json({ success: false, message: schemaErr.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_plan: "bronce",
        subscription_billing_cycle: "annual",
        subscription_expires_at: computeSubscriptionExpiry("annual"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .select(MEMBERSHIP_SELECT)
      .single();

    if (error) throw error;
    res.json({ success: true, membership: mapMembership(data) });
  } catch (error) {
    console.error("cancelSubscription:", error);
    const schemaErr = membershipSchemaError(error);
    if (schemaErr) {
      return res.status(schemaErr.status).json({ success: false, message: schemaErr.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
