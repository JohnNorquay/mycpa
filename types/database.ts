export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          date_of_birth: string | null
          filing_status:
            | 'single'
            | 'married_filing_jointly'
            | 'married_filing_separately'
            | 'head_of_household'
            | 'qualifying_widow'
            | null
          dependents: number
          state: string | null
          county: string | null
          employment_status:
            | 'employed'
            | 'self_employed'
            | 'unemployed'
            | 'retired'
            | 'disabled'
            | null
          has_health_conditions: boolean
          health_conditions_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          filing_status?:
            | 'single'
            | 'married_filing_jointly'
            | 'married_filing_separately'
            | 'head_of_household'
            | 'qualifying_widow'
            | null
          dependents?: number
          state?: string | null
          county?: string | null
          employment_status?:
            | 'employed'
            | 'self_employed'
            | 'unemployed'
            | 'retired'
            | 'disabled'
            | null
          has_health_conditions?: boolean
          health_conditions_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          filing_status?:
            | 'single'
            | 'married_filing_jointly'
            | 'married_filing_separately'
            | 'head_of_household'
            | 'qualifying_widow'
            | null
          dependents?: number
          state?: string | null
          county?: string | null
          employment_status?:
            | 'employed'
            | 'self_employed'
            | 'unemployed'
            | 'retired'
            | 'disabled'
            | null
          has_health_conditions?: boolean
          health_conditions_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tax_debt: {
        Row: {
          id: string
          user_id: string
          tax_year: number
          debt_type:
            | 'income_tax'
            | 'penalty_failure_to_file'
            | 'penalty_failure_to_pay'
            | 'interest'
            | 'other'
            | null
          original_amount: number
          current_balance: number
          interest_rate: number
          penalty_rate: number | null
          source: 'w2_shortage' | '1099_unreported' | 'business' | 'estimated_tax' | 'other' | null
          collection_status:
            | 'normal'
            | 'notice_sent'
            | 'lien_filed'
            | 'levy_pending'
            | 'levy_active'
            | 'garnishment'
            | 'currently_not_collectible'
          statute_expiration_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tax_year: number
          debt_type?:
            | 'income_tax'
            | 'penalty_failure_to_file'
            | 'penalty_failure_to_pay'
            | 'interest'
            | 'other'
            | null
          original_amount: number
          current_balance: number
          interest_rate?: number
          penalty_rate?: number | null
          source?: 'w2_shortage' | '1099_unreported' | 'business' | 'estimated_tax' | 'other' | null
          collection_status?:
            | 'normal'
            | 'notice_sent'
            | 'lien_filed'
            | 'levy_pending'
            | 'levy_active'
            | 'garnishment'
            | 'currently_not_collectible'
          statute_expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tax_year?: number
          debt_type?:
            | 'income_tax'
            | 'penalty_failure_to_file'
            | 'penalty_failure_to_pay'
            | 'interest'
            | 'other'
            | null
          original_amount?: number
          current_balance?: number
          interest_rate?: number
          penalty_rate?: number | null
          source?: 'w2_shortage' | '1099_unreported' | 'business' | 'estimated_tax' | 'other' | null
          collection_status?:
            | 'normal'
            | 'notice_sent'
            | 'lien_filed'
            | 'levy_pending'
            | 'levy_active'
            | 'garnishment'
            | 'currently_not_collectible'
          statute_expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tax_debt_payments: {
        Row: {
          id: string
          tax_debt_id: string
          payment_date: string
          amount: number
          payment_method: string | null
          applied_to: 'principal' | 'interest' | 'penalty' | 'mixed' | null
          confirmation_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tax_debt_id: string
          payment_date: string
          amount: number
          payment_method?: string | null
          applied_to?: 'principal' | 'interest' | 'penalty' | 'mixed' | null
          confirmation_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tax_debt_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string | null
          applied_to?: 'principal' | 'interest' | 'penalty' | 'mixed' | null
          confirmation_number?: string | null
          created_at?: string
        }
      }
      irs_correspondence: {
        Row: {
          id: string
          user_id: string
          tax_debt_id: string | null
          notice_date: string
          notice_type: string
          notice_number: string | null
          response_deadline: string | null
          status: 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'
          document_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tax_debt_id?: string | null
          notice_date: string
          notice_type: string
          notice_number?: string | null
          response_deadline?: string | null
          status?: 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'
          document_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tax_debt_id?: string | null
          notice_date?: string
          notice_type?: string
          notice_number?: string | null
          response_deadline?: string | null
          status?: 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'
          document_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      financial_snapshot: {
        Row: {
          id: string
          user_id: string
          relief_application_id: string | null
          snapshot_date: string
          monthly_gross_income: number | null
          monthly_net_income: number | null
          monthly_allowable_expenses: number | null
          monthly_disposable_income: number | null
          total_asset_equity: number | null
          home_equity: number | null
          vehicle_equity: number | null
          bank_balance: number | null
          investment_value: number | null
          reasonable_collection_potential: number | null
          future_income_months: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          relief_application_id?: string | null
          snapshot_date?: string
          monthly_gross_income?: number | null
          monthly_net_income?: number | null
          monthly_allowable_expenses?: number | null
          monthly_disposable_income?: number | null
          total_asset_equity?: number | null
          home_equity?: number | null
          vehicle_equity?: number | null
          bank_balance?: number | null
          investment_value?: number | null
          reasonable_collection_potential?: number | null
          future_income_months?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          relief_application_id?: string | null
          snapshot_date?: string
          monthly_gross_income?: number | null
          monthly_net_income?: number | null
          monthly_allowable_expenses?: number | null
          monthly_disposable_income?: number | null
          total_asset_equity?: number | null
          home_equity?: number | null
          vehicle_equity?: number | null
          bank_balance?: number | null
          investment_value?: number | null
          reasonable_collection_potential?: number | null
          future_income_months?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      irs_allowable_expenses: {
        Row: {
          id: string
          user_id: string
          financial_snapshot_id: string | null
          category: string
          irs_allowable_amount: number | null
          actual_amount: number | null
          variance: number | null
          justification: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          financial_snapshot_id?: string | null
          category: string
          irs_allowable_amount?: number | null
          actual_amount?: number | null
          variance?: number | null
          justification?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          financial_snapshot_id?: string | null
          category?: string
          irs_allowable_amount?: number | null
          actual_amount?: number | null
          variance?: number | null
          justification?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      relief_applications: {
        Row: {
          id: string
          user_id: string
          application_type: 'oic' | 'installment_agreement' | 'penalty_abatement' | 'cnc'
          status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'appealing'
          submission_date: string | null
          decision_date: string | null
          application_data: Json | null
          outcome: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          application_type: 'oic' | 'installment_agreement' | 'penalty_abatement' | 'cnc'
          status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'appealing'
          submission_date?: string | null
          decision_date?: string | null
          application_data?: Json | null
          outcome?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          application_type?: 'oic' | 'installment_agreement' | 'penalty_abatement' | 'cnc'
          status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'appealing'
          submission_date?: string | null
          decision_date?: string | null
          application_data?: Json | null
          outcome?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          item_id: string
          access_token: string
          institution_name: string | null
          cursor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          access_token: string
          institution_name?: string | null
          cursor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          access_token?: string
          institution_name?: string | null
          cursor?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string | null
          account_id: string
          name: string
          type: string | null
          subtype: string | null
          current_balance: number | null
          available_balance: number | null
          last_synced: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id?: string | null
          account_id: string
          name: string
          type?: string | null
          subtype?: string | null
          current_balance?: number | null
          available_balance?: number | null
          last_synced?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plaid_item_id?: string | null
          account_id?: string
          name?: string
          type?: string | null
          subtype?: string | null
          current_balance?: number | null
          available_balance?: number | null
          last_synced?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          transaction_id: string
          date: string
          amount: number
          merchant_name: string | null
          category: string | null
          category_confidence: number | null
          is_tax_deductible: boolean
          is_recurring: boolean
          recurrence_pattern: string | null
          notes: string | null
          receipt_document_id: string | null
          is_removed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          transaction_id: string
          date: string
          amount: number
          merchant_name?: string | null
          category?: string | null
          category_confidence?: number | null
          is_tax_deductible?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          notes?: string | null
          receipt_document_id?: string | null
          is_removed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          transaction_id?: string
          date?: string
          amount?: number
          merchant_name?: string | null
          category?: string | null
          category_confidence?: number | null
          is_tax_deductible?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          notes?: string | null
          receipt_document_id?: string | null
          is_removed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          category: string | null
          expected_amount: number | null
          amount_variance: number | null
          frequency:
            | 'weekly'
            | 'biweekly'
            | 'semimonthly'
            | 'monthly'
            | 'quarterly'
            | 'annual'
            | null
          expected_day: number | null
          last_occurrence: string | null
          next_expected: string | null
          is_income: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_name: string
          category?: string | null
          expected_amount?: number | null
          amount_variance?: number | null
          frequency?:
            | 'weekly'
            | 'biweekly'
            | 'semimonthly'
            | 'monthly'
            | 'quarterly'
            | 'annual'
            | null
          expected_day?: number | null
          last_occurrence?: string | null
          next_expected?: string | null
          is_income?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_name?: string
          category?: string | null
          expected_amount?: number | null
          amount_variance?: number | null
          frequency?:
            | 'weekly'
            | 'biweekly'
            | 'semimonthly'
            | 'monthly'
            | 'quarterly'
            | 'annual'
            | null
          expected_day?: number | null
          last_occurrence?: string | null
          next_expected?: string | null
          is_income?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          parent_category: string | null
          is_tax_deductible: boolean
          color: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          parent_category?: string | null
          is_tax_deductible?: boolean
          color?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          parent_category?: string | null
          is_tax_deductible?: boolean
          color?: string | null
        }
      }
      merchant_category_cache: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          category: string
          is_tax_deductible: boolean
          confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_name: string
          category: string
          is_tax_deductible?: boolean
          confidence?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_name?: string
          category?: string
          is_tax_deductible?: boolean
          confidence?: number
          created_at?: string
          updated_at?: string
        }
      }
      tax_documents: {
        Row: {
          id: string
          user_id: string
          tax_year: number
          document_type: string | null
          file_path: string
          extracted_data: Json | null
          upload_date: string
          processed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          tax_year: number
          document_type?: string | null
          file_path: string
          extracted_data?: Json | null
          upload_date?: string
          processed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          tax_year?: number
          document_type?: string | null
          file_path?: string
          extracted_data?: Json | null
          upload_date?: string
          processed?: boolean
        }
      }
      tax_projections: {
        Row: {
          id: string
          user_id: string
          tax_year: number
          projection_date: string
          estimated_income: number | null
          estimated_deductions: number | null
          estimated_tax_liability: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tax_year: number
          projection_date?: string
          estimated_income?: number | null
          estimated_deductions?: number | null
          estimated_tax_liability?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tax_year?: number
          projection_date?: string
          estimated_income?: number | null
          estimated_deductions?: number | null
          estimated_tax_liability?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      irs_national_standards: {
        Row: {
          id: string
          year: number
          category: string
          household_size: number | null
          state: string | null
          county: string | null
          amount: number
        }
        Insert: {
          id?: string
          year: number
          category: string
          household_size?: number | null
          state?: string | null
          county?: string | null
          amount: number
        }
        Update: {
          id?: string
          year?: number
          category?: string
          household_size?: number | null
          state?: string | null
          county?: string | null
          amount?: number
        }
      }
      tax_brackets: {
        Row: {
          id: string
          year: number
          filing_status: string
          min_income: number
          max_income: number | null
          rate: number
          base_tax: number
        }
        Insert: {
          id?: string
          year: number
          filing_status: string
          min_income: number
          max_income?: number | null
          rate: number
          base_tax?: number
        }
        Update: {
          id?: string
          year?: number
          filing_status?: string
          min_income?: number
          max_income?: number | null
          rate?: number
          base_tax?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
