export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cliente_enderecos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_id: string
          complemento: string | null
          created_at: string
          estado: string | null
          id: string
          label: string | null
          logradouro: string | null
          numero: string | null
          principal: boolean
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id: string
          complemento?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          label?: string | null
          logradouro?: string | null
          numero?: string | null
          principal?: boolean
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id?: string
          complemento?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          label?: string | null
          logradouro?: string | null
          numero?: string | null
          principal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cliente_enderecos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_insights: {
        Row: {
          analise: string
          cliente_id: string
          gerado_em: string
          id: string
        }
        Insert: {
          analise: string
          cliente_id: string
          gerado_em?: string
          id?: string
        }
        Update: {
          analise?: string
          cliente_id?: string
          gerado_em?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_insights_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_telefones: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          numero: string
          principal: boolean
          tipo: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          numero: string
          principal?: boolean
          tipo?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          numero?: string
          principal?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_telefones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cargo: string | null
          created_at: string
          created_by: string | null
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etapa_transicoes: {
        Row: {
          created_at: string
          etapa_destino_id: string
          etapa_origem_id: string
          id: string
        }
        Insert: {
          created_at?: string
          etapa_destino_id: string
          etapa_origem_id: string
          id?: string
        }
        Update: {
          created_at?: string
          etapa_destino_id?: string
          etapa_origem_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapa_transicoes_etapa_destino_id_fkey"
            columns: ["etapa_destino_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapa_transicoes_etapa_origem_id_fkey"
            columns: ["etapa_origem_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          created_at: string
          id: string
          is_lost_stage: boolean
          is_won_stage: boolean
          nome: string
          pipeline_id: string
          posicao: number
          probabilidade_conversao: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_lost_stage?: boolean
          is_won_stage?: boolean
          nome: string
          pipeline_id: string
          posicao: number
          probabilidade_conversao?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_lost_stage?: boolean
          is_won_stage?: boolean
          nome?: string
          pipeline_id?: string
          posicao?: number
          probabilidade_conversao?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          concluido: boolean
          created_at: string
          descricao: string | null
          fim: string | null
          id: string
          inicio: string
          negocio_id: string | null
          owner_id: string
          tipo: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio: string
          negocio_id?: string | null
          owner_id: string
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at?: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          negocio_id?: string | null
          owner_id?: string
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formulario_campos: {
        Row: {
          chave: string
          created_at: string
          formulario_id: string
          id: string
          mapeia_para: string | null
          obrigatorio: boolean
          opcoes: Json | null
          posicao: number
          rotulo: string
          tipo: Database["public"]["Enums"]["campo_tipo"]
        }
        Insert: {
          chave: string
          created_at?: string
          formulario_id: string
          id?: string
          mapeia_para?: string | null
          obrigatorio?: boolean
          opcoes?: Json | null
          posicao?: number
          rotulo: string
          tipo?: Database["public"]["Enums"]["campo_tipo"]
        }
        Update: {
          chave?: string
          created_at?: string
          formulario_id?: string
          id?: string
          mapeia_para?: string | null
          obrigatorio?: boolean
          opcoes?: Json | null
          posicao?: number
          rotulo?: string
          tipo?: Database["public"]["Enums"]["campo_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "formulario_campos_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      formulario_submissoes: {
        Row: {
          cliente_id: string | null
          created_at: string
          dados: Json
          formulario_id: string
          id: string
          negocio_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          dados: Json
          formulario_id: string
          id?: string
          negocio_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          dados?: Json
          formulario_id?: string
          id?: string
          negocio_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulario_submissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_submissoes_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_submissoes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_submissoes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          etapa_id: string
          id: string
          nome: string
          owner_padrao_id: string
          pipeline_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          etapa_id: string
          id?: string
          nome: string
          owner_padrao_id: string
          pipeline_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          etapa_id?: string
          id?: string
          nome?: string
          owner_padrao_id?: string
          pipeline_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formularios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_owner_padrao_id_fkey"
            columns: ["owner_padrao_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_historico: {
        Row: {
          autor_id: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          id: string
          negocio_id: string
          tipo: Database["public"]["Enums"]["historico_tipo"]
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          id?: string
          negocio_id: string
          tipo: Database["public"]["Enums"]["historico_tipo"]
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          id?: string
          negocio_id?: string
          tipo?: Database["public"]["Enums"]["historico_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "negocio_historico_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocio_historico_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocio_historico_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_insights: {
        Row: {
          gerado_em: string
          id: string
          negocio_id: string
          pontos_atencao: string | null
          proxima_acao_sugerida: string | null
          resumo: string
          sentimento: string | null
        }
        Insert: {
          gerado_em?: string
          id?: string
          negocio_id: string
          pontos_atencao?: string | null
          proxima_acao_sugerida?: string | null
          resumo: string
          sentimento?: string | null
        }
        Update: {
          gerado_em?: string
          id?: string
          negocio_id?: string
          pontos_atencao?: string | null
          proxima_acao_sugerida?: string | null
          resumo?: string
          sentimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocio_insights_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocio_insights_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_ofertas: {
        Row: {
          created_at: string
          id: string
          negocio_id: string
          oferta_id: string
          preco_unitario_snapshot: number
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          negocio_id: string
          oferta_id: string
          preco_unitario_snapshot: number
          quantidade?: number
        }
        Update: {
          created_at?: string
          id?: string
          negocio_id?: string
          oferta_id?: string
          preco_unitario_snapshot?: number
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "negocio_ofertas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocio_ofertas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocio_ofertas_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          cliente_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          etapa_id: string
          id: string
          owner_id: string
          pipeline_id: string
          stage_entered_at: string
          status: Database["public"]["Enums"]["deal_status"]
          titulo: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor: number
          valor_manual: number
        }
        Insert: {
          cliente_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          etapa_id: string
          id?: string
          owner_id: string
          pipeline_id: string
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["deal_status"]
          titulo: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number
          valor_manual?: number
        }
        Update: {
          cliente_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          etapa_id?: string
          id?: string
          owner_id?: string
          pipeline_id?: string
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["deal_status"]
          titulo?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number
          valor_manual?: number
        }
        Relationships: [
          {
            foreignKeyName: "negocios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      oferta_precos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          oferta_id: string
          preco: number
          valido_ate: string | null
          valido_desde: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          oferta_id: string
          preco: number
          valido_ate?: string | null
          valido_desde?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          oferta_id?: string
          preco?: number
          valido_ate?: string | null
          valido_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "oferta_precos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oferta_precos_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          nome: string
          preco_atual: number
          produto_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
          preco_atual?: number
          produto_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
          preco_atual?: number
          produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          concluida: boolean
          created_at: string
          descricao: string | null
          id: string
          negocio_id: string | null
          owner_id: string
          prazo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          negocio_id?: string | null
          owner_id: string
          prazo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          negocio_id?: string | null
          owner_id?: string
          prazo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "v_negocio_tempo_parado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_negocio_tempo_parado: {
        Row: {
          cliente_id: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          dias_parado: number | null
          etapa_id: string | null
          id: string | null
          owner_id: string | null
          pipeline_id: string | null
          stage_entered_at: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          titulo: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dias_parado?: never
          etapa_id?: string | null
          id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          titulo?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          dias_parado?: never
          etapa_id?: string | null
          id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          titulo?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_report_funil: {
        Args: { p_pipeline_id: string }
        Returns: {
          dias_parado_medio: number
          etapa_id: string
          etapa_nome: string
          posicao: number
          probabilidade_conversao: number
          quantidade: number
          quantidade_parada: number
          valor_total: number
        }[]
      }
      get_report_resumo: {
        Args: { p_pipeline_id?: string }
        Returns: {
          quantidade_aberta: number
          quantidade_ganha: number
          quantidade_perdida: number
          total_aberto: number
          total_ponderado: number
          valor_ganho: number
        }[]
      }
      get_report_utm: {
        Args: { p_pipeline_id?: string }
        Returns: {
          quantidade: number
          quantidade_ganha: number
          utm_source: string
          valor_ganho: number
          valor_total: number
        }[]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      recalc_negocio_valor: {
        Args: { p_negocio_id: string }
        Returns: undefined
      }
      set_oferta_preco: {
        Args: { p_novo_preco: number; p_oferta_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      campo_tipo:
        | "texto"
        | "email"
        | "telefone"
        | "numero"
        | "select"
        | "textarea"
      deal_status: "open" | "won" | "lost"
      evento_tipo: "reuniao" | "ligacao" | "outro" | "email" | "visita"
      historico_tipo:
        | "criado"
        | "etapa_alterada"
        | "status_alterado"
        | "nota"
        | "campo_alterado"
        | "oferta_adicionada"
        | "oferta_removida"
      user_role: "admin" | "sales_rep"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      campo_tipo: [
        "texto",
        "email",
        "telefone",
        "numero",
        "select",
        "textarea",
      ],
      deal_status: ["open", "won", "lost"],
      evento_tipo: ["reuniao", "ligacao", "outro", "email", "visita"],
      historico_tipo: [
        "criado",
        "etapa_alterada",
        "status_alterado",
        "nota",
        "campo_alterado",
        "oferta_adicionada",
        "oferta_removida",
      ],
      user_role: ["admin", "sales_rep"],
    },
  },
} as const
