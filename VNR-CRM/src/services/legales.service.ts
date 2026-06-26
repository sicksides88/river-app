import { supabase } from './supabase';

export type DocumentStatus = 'draft' | 'published' | 'archived';
export type DocumentType = 'terms' | 'privacy' | 'contract' | 'policy' | 'agreement' | 'other';

export interface LegalDocument {
  id: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  status: DocumentStatus;
  document_type: DocumentType;
  is_required: boolean;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalDocumentVersion {
  id: string;
  document_id: string;
  version: string;
  content: string;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
  creator?: {
    nombre: string;
    apellido: string;
  };
}

export interface CreateDocumentInput {
  title: string;
  slug?: string;
  content: string;
  document_type: DocumentType;
  is_required?: boolean;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  document_type?: DocumentType;
  is_required?: boolean;
  change_summary?: string;
}

export const legalesService = {
  // Get all documents
  async getAll(): Promise<LegalDocument[]> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get document by ID
  async getById(id: string): Promise<LegalDocument | null> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Get document by slug
  async getBySlug(slug: string): Promise<LegalDocument | null> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create document
  async create(input: CreateDocumentInput, userId?: string): Promise<LegalDocument> {
    const slug = input.slug || this.generateSlug(input.title);

    const { data, error } = await supabase
      .from('legal_documents')
      .insert({
        title: input.title,
        slug,
        content: input.content,
        document_type: input.document_type,
        is_required: input.is_required || false,
        version: '1.0',
        status: 'draft',
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update document (creates a new version)
  async update(
    id: string,
    input: UpdateDocumentInput,
    userId?: string
  ): Promise<LegalDocument> {
    // Get current document
    const current = await this.getById(id);
    if (!current) throw new Error('Documento no encontrado');

    // If content changed, save version history
    if (input.content && input.content !== current.content) {
      const newVersion = this.incrementVersion(current.version);

      // Save current version to history
      await supabase.from('legal_document_versions').insert({
        document_id: id,
        version: current.version,
        content: current.content,
        change_summary: input.change_summary || null,
        created_by: userId,
      });

      // Update document with new version
      const { data, error } = await supabase
        .from('legal_documents')
        .update({
          title: input.title ?? current.title,
          content: input.content,
          document_type: input.document_type ?? current.document_type,
          is_required: input.is_required ?? current.is_required,
          version: newVersion,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // No content change, just update metadata
    const { data, error } = await supabase
      .from('legal_documents')
      .update({
        title: input.title ?? current.title,
        document_type: input.document_type ?? current.document_type,
        is_required: input.is_required ?? current.is_required,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Publish document
  async publish(id: string, userId?: string): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Archive document
  async archive(id: string, userId?: string): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .update({
        status: 'archived',
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Restore to draft
  async restoreToDraft(id: string, userId?: string): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .update({
        status: 'draft',
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete document
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get version history for a document
  async getVersionHistory(documentId: string): Promise<LegalDocumentVersion[]> {
    const { data, error } = await supabase
      .from('legal_document_versions')
      .select(`
        *,
        creator:profiles!legal_document_versions_created_by_fkey(nombre, apellido)
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(v => ({
      ...v,
      creator: v.creator as unknown as { nombre: string; apellido: string } | undefined,
    }));
  },

  // Get recent changes across all documents
  async getRecentChanges(limit = 10): Promise<Array<LegalDocumentVersion & { document?: LegalDocument }>> {
    const { data, error } = await supabase
      .from('legal_document_versions')
      .select(`
        *,
        document:legal_documents(id, title, slug),
        creator:profiles!legal_document_versions_created_by_fkey(nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(v => ({
      ...v,
      document: v.document as unknown as LegalDocument | undefined,
      creator: v.creator as unknown as { nombre: string; apellido: string } | undefined,
    }));
  },

  // Helper: Generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Helper: Increment version
  incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length === 2) {
      const minor = parseInt(parts[1]) + 1;
      return `${parts[0]}.${minor}`;
    }
    return `${version}.1`;
  },

  // Helper: Get document type label
  getDocumentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      contract: 'Contrato',
      policy: 'Política',
      agreement: 'Acuerdo',
      other: 'Otro',
    };
    return labels[type] || type;
  },

  // Helper: Get status label
  getStatusLabel(status: DocumentStatus): string {
    const labels: Record<DocumentStatus, string> = {
      draft: 'Borrador',
      published: 'Publicado',
      archived: 'Archivado',
    };
    return labels[status] || status;
  },

  // Helper: Get status color
  getStatusColor(status: DocumentStatus): string {
    const colors: Record<DocumentStatus, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },
};
