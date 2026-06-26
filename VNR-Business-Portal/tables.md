[
  {
    "table_schema": "public",
    "table_name": "deliveries",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "driver_availability",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "driver_documents",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "driver_vehicles",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "rides",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "saved_locations",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "trust_points_config",
    "table_type": "BASE TABLE"
  },
  {
    "table_schema": "public",
    "table_name": "trust_points_log",
    "table_type": "BASE TABLE"
  }
]

[
  {
    "table_name": "deliveries",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "deliveries",
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "deliveries",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "deliveries",
    "column_name": "service_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "deliveries",
    "column_name": "delivery_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "deliveries",
    "column_name": "pickup_address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "table_name": "deliveries",
    "column_name": "pickup_lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "deliveries",
    "column_name": "pickup_lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "table_name": "deliveries",
    "column_name": "pickup_contact_name",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 9
  },
  {
    "table_name": "deliveries",
    "column_name": "pickup_contact_phone",
    "data_type": "character varying",
    "character_maximum_length": 30,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 10
  },
  {
    "table_name": "deliveries",
    "column_name": "dropoff_address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 11
  },
  {
    "table_name": "deliveries",
    "column_name": "dropoff_lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 12
  },
  {
    "table_name": "deliveries",
    "column_name": "dropoff_lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 13
  },
  {
    "table_name": "deliveries",
    "column_name": "dropoff_contact_name",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 14
  },
  {
    "table_name": "deliveries",
    "column_name": "dropoff_contact_phone",
    "data_type": "character varying",
    "character_maximum_length": 30,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 15
  },
  {
    "table_name": "deliveries",
    "column_name": "scheduled_date",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 16
  },
  {
    "table_name": "deliveries",
    "column_name": "scheduled_hour",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 17
  },
  {
    "table_name": "deliveries",
    "column_name": "scheduled_minute",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 18
  },
  {
    "table_name": "deliveries",
    "column_name": "package_description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 19
  },
  {
    "table_name": "deliveries",
    "column_name": "package_weight",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 20
  },
  {
    "table_name": "deliveries",
    "column_name": "package_length",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 21
  },
  {
    "table_name": "deliveries",
    "column_name": "package_width",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 22
  },
  {
    "table_name": "deliveries",
    "column_name": "package_height",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 23
  },
  {
    "table_name": "deliveries",
    "column_name": "package_is_fragile",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 24
  },
  {
    "table_name": "deliveries",
    "column_name": "status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'pending'::character varying",
    "ordinal_position": 25
  },
  {
    "table_name": "deliveries",
    "column_name": "estimated_price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 26
  },
  {
    "table_name": "deliveries",
    "column_name": "actual_price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 27
  },
  {
    "table_name": "deliveries",
    "column_name": "distance",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 28
  },
  {
    "table_name": "deliveries",
    "column_name": "tracking_number",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 29
  },
  {
    "table_name": "deliveries",
    "column_name": "notes",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 30
  },
  {
    "table_name": "deliveries",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 31
  },
  {
    "table_name": "deliveries",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 32
  },
  {
    "table_name": "driver_availability",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "driver_availability",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "driver_availability",
    "column_name": "is_online",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 3
  },
  {
    "table_name": "driver_availability",
    "column_name": "is_busy",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 4
  },
  {
    "table_name": "driver_availability",
    "column_name": "current_lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "NULL::numeric",
    "ordinal_position": 5
  },
  {
    "table_name": "driver_availability",
    "column_name": "current_lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "NULL::numeric",
    "ordinal_position": 6
  },
  {
    "table_name": "driver_availability",
    "column_name": "location_updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "driver_availability",
    "column_name": "accepts_vuelta_segura",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "true",
    "ordinal_position": 8
  },
  {
    "table_name": "driver_availability",
    "column_name": "accepts_chofer",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "true",
    "ordinal_position": 9
  },
  {
    "table_name": "driver_availability",
    "column_name": "accepts_envios",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "true",
    "ordinal_position": 10
  },
  {
    "table_name": "driver_availability",
    "column_name": "accepts_fletes",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 11
  },
  {
    "table_name": "driver_availability",
    "column_name": "session_started_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 12
  },
  {
    "table_name": "driver_availability",
    "column_name": "trips_completed_today",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "ordinal_position": 13
  },
  {
    "table_name": "driver_availability",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 14
  },
  {
    "table_name": "driver_documents",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "ordinal_position": 1
  },
  {
    "table_name": "driver_documents",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "driver_documents",
    "column_name": "document_type",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "driver_documents",
    "column_name": "file_url",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "driver_documents",
    "column_name": "file_name",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "driver_documents",
    "column_name": "status",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'pending'::text",
    "ordinal_position": 6
  },
  {
    "table_name": "driver_documents",
    "column_name": "rejection_reason",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "driver_documents",
    "column_name": "reviewed_by",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "table_name": "driver_documents",
    "column_name": "reviewed_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 9
  },
  {
    "table_name": "driver_documents",
    "column_name": "expires_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 10
  },
  {
    "table_name": "driver_documents",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 11
  },
  {
    "table_name": "driver_documents",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 12
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "plate",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "brand",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "model",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "year",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "color",
    "data_type": "character varying",
    "character_maximum_length": 30,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "vehicle_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "is_active",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "true",
    "ordinal_position": 9
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "is_verified",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 10
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "verified_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 11
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "photo_url",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 12
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 13
  },
  {
    "table_name": "driver_vehicles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 14
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 1
  },
  {
    "table_name": "profiles",
    "column_name": "nombre",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "profiles",
    "column_name": "apellido",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "profiles",
    "column_name": "email",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "profiles",
    "column_name": "telefono_codigo_pais",
    "data_type": "character varying",
    "character_maximum_length": 10,
    "is_nullable": "YES",
    "column_default": "'+54'::character varying",
    "ordinal_position": 5
  },
  {
    "table_name": "profiles",
    "column_name": "telefono_numero",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "table_name": "profiles",
    "column_name": "direccion",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "profiles",
    "column_name": "role",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'user'::character varying",
    "ordinal_position": 8
  },
  {
    "table_name": "profiles",
    "column_name": "is_verified",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "false",
    "ordinal_position": 9
  },
  {
    "table_name": "profiles",
    "column_name": "avatar",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "''::text",
    "ordinal_position": 10
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 11
  },
  {
    "table_name": "profiles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 12
  },
  {
    "table_name": "profiles",
    "column_name": "driver_status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "NULL::character varying",
    "ordinal_position": 13
  },
  {
    "table_name": "profiles",
    "column_name": "driver_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "NULL::character varying",
    "ordinal_position": 14
  },
  {
    "table_name": "profiles",
    "column_name": "trust_points",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "ordinal_position": 15
  },
  {
    "table_name": "profiles",
    "column_name": "trust_level",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'bronce'::character varying",
    "ordinal_position": 16
  },
  {
    "table_name": "profiles",
    "column_name": "driver_approved_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 17
  },
  {
    "table_name": "profiles",
    "column_name": "driver_suspended_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 18
  },
  {
    "table_name": "profiles",
    "column_name": "suspension_reason",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 19
  },
  {
    "table_name": "rides",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "rides",
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "rides",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "rides",
    "column_name": "service_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "rides",
    "column_name": "pickup_address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "rides",
    "column_name": "pickup_lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "table_name": "rides",
    "column_name": "pickup_lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "rides",
    "column_name": "dropoff_address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "table_name": "rides",
    "column_name": "dropoff_lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 9
  },
  {
    "table_name": "rides",
    "column_name": "dropoff_lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 10
  },
  {
    "table_name": "rides",
    "column_name": "scheduled_date",
    "data_type": "date",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 11
  },
  {
    "table_name": "rides",
    "column_name": "scheduled_hour",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 12
  },
  {
    "table_name": "rides",
    "column_name": "scheduled_minute",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 13
  },
  {
    "table_name": "rides",
    "column_name": "status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'pending'::character varying",
    "ordinal_position": 14
  },
  {
    "table_name": "rides",
    "column_name": "estimated_price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 15
  },
  {
    "table_name": "rides",
    "column_name": "actual_price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 16
  },
  {
    "table_name": "rides",
    "column_name": "distance",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 17
  },
  {
    "table_name": "rides",
    "column_name": "duration",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 18
  },
  {
    "table_name": "rides",
    "column_name": "notes",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 19
  },
  {
    "table_name": "rides",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 20
  },
  {
    "table_name": "rides",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 21
  },
  {
    "table_name": "saved_locations",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "saved_locations",
    "column_name": "user_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "saved_locations",
    "column_name": "address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "saved_locations",
    "column_name": "formatted_address",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "saved_locations",
    "column_name": "lat",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "saved_locations",
    "column_name": "lng",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 6
  },
  {
    "table_name": "saved_locations",
    "column_name": "location_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'both'::character varying",
    "ordinal_position": 7
  },
  {
    "table_name": "saved_locations",
    "column_name": "label",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'other'::character varying",
    "ordinal_position": 8
  },
  {
    "table_name": "saved_locations",
    "column_name": "last_used",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 9
  },
  {
    "table_name": "saved_locations",
    "column_name": "usage_count",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "ordinal_position": 10
  },
  {
    "table_name": "saved_locations",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 11
  },
  {
    "table_name": "saved_locations",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 12
  },
  {
    "table_name": "trust_points_config",
    "column_name": "reason",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 1
  },
  {
    "table_name": "trust_points_config",
    "column_name": "points",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "trust_points_config",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "trust_points_log",
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "ordinal_position": 1
  },
  {
    "table_name": "trust_points_log",
    "column_name": "driver_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 2
  },
  {
    "table_name": "trust_points_log",
    "column_name": "points",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 3
  },
  {
    "table_name": "trust_points_log",
    "column_name": "reason",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 4
  },
  {
    "table_name": "trust_points_log",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 5
  },
  {
    "table_name": "trust_points_log",
    "column_name": "reference_type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "NULL::character varying",
    "ordinal_position": 6
  },
  {
    "table_name": "trust_points_log",
    "column_name": "reference_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 7
  },
  {
    "table_name": "trust_points_log",
    "column_name": "points_before",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 8
  },
  {
    "table_name": "trust_points_log",
    "column_name": "points_after",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "ordinal_position": 9
  },
  {
    "table_name": "trust_points_log",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "ordinal_position": 10
  },
  {
    "table_name": "trust_points_log",
    "column_name": "created_by",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "ordinal_position": 11
  }
]

[
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_delivery_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "deliveries",
    "foreign_column_name": "delivery_type"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_11_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "2200_18642_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_status_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "deliveries",
    "foreign_column_name": "status"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_service_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "deliveries",
    "foreign_column_name": "service_type"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "deliveries",
    "foreign_column_name": "id"
  },
  {
    "table_name": "deliveries",
    "constraint_name": "deliveries_tracking_number_key",
    "constraint_type": "UNIQUE",
    "column_name": "tracking_number",
    "foreign_table_name": "deliveries",
    "foreign_column_name": "tracking_number"
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_20148_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_20148_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_availability",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_driver_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "driver_id",
    "foreign_table_name": "driver_availability",
    "foreign_column_name": "driver_id"
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "2200_20246_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "2200_20246_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "driver_documents_document_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "driver_documents",
    "foreign_column_name": "document_type"
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "2200_20246_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "driver_documents_status_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "driver_documents",
    "foreign_column_name": "status"
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "2200_20246_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "driver_documents_reviewed_by_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "reviewed_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "driver_documents_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_documents",
    "constraint_name": "driver_documents_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_documents",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_vehicle_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "vehicle_type"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_7_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "2200_20056_8_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "vehicle_type",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "vehicle_type"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "is_active",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "driver_id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "is_active",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "is_active"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "driver_id",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "driver_id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "is_active",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "vehicle_type"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "vehicle_type",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "is_active"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "vehicle_type",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "driver_id"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "driver_id",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "vehicle_type"
  },
  {
    "table_name": "driver_vehicles",
    "constraint_name": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "constraint_type": "UNIQUE",
    "column_name": "driver_id",
    "foreign_table_name": "driver_vehicles",
    "foreign_column_name": "is_active"
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_driver_status_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "profiles",
    "foreign_column_name": "driver_status"
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_role_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "profiles",
    "foreign_column_name": "role"
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_trust_level_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "profiles",
    "foreign_column_name": "trust_level"
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_18593_7_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_driver_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "profiles",
    "foreign_column_name": "driver_type"
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_email_key",
    "constraint_type": "UNIQUE",
    "column_name": "email",
    "foreign_table_name": "profiles",
    "foreign_column_name": "email"
  },
  {
    "table_name": "rides",
    "constraint_name": "2200_18616_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "rides",
    "constraint_name": "2200_18616_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "rides",
    "constraint_name": "2200_18616_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "rides",
    "constraint_name": "2200_18616_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "rides",
    "constraint_name": "2200_18616_8_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "rides",
    "constraint_name": "rides_status_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "rides",
    "foreign_column_name": "status"
  },
  {
    "table_name": "rides",
    "constraint_name": "rides_service_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "rides",
    "foreign_column_name": "service_type"
  },
  {
    "table_name": "rides",
    "constraint_name": "rides_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "rides",
    "constraint_name": "rides_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "rides",
    "constraint_name": "rides_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "rides",
    "foreign_column_name": "id"
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "2200_18673_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "saved_locations_label_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "saved_locations",
    "foreign_column_name": "label"
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "2200_18673_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "2200_18673_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "saved_locations_location_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "saved_locations",
    "foreign_column_name": "location_type"
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "2200_18673_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "2200_18673_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "saved_locations_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "saved_locations",
    "constraint_name": "saved_locations_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "saved_locations",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trust_points_config",
    "constraint_name": "2200_20219_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_config",
    "constraint_name": "2200_20219_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_config",
    "constraint_name": "trust_points_config_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "reason",
    "foreign_table_name": "trust_points_config",
    "foreign_column_name": "reason"
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "trust_points_log_reason_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "trust_points_log",
    "foreign_column_name": "reason"
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "trust_points_log_reference_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "trust_points_log",
    "foreign_column_name": "reference_type"
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_8_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "2200_20101_9_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "trust_points_log_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "trust_points_log_created_by_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trust_points_log",
    "constraint_name": "trust_points_log_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "trust_points_log",
    "foreign_column_name": "id"
  }
]

[
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "deliveries_pkey",
    "indexdef": "CREATE UNIQUE INDEX deliveries_pkey ON public.deliveries USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "deliveries_tracking_number_key",
    "indexdef": "CREATE UNIQUE INDEX deliveries_tracking_number_key ON public.deliveries USING btree (tracking_number)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "idx_deliveries_driver",
    "indexdef": "CREATE INDEX idx_deliveries_driver ON public.deliveries USING btree (driver_id, status)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "idx_deliveries_status",
    "indexdef": "CREATE INDEX idx_deliveries_status ON public.deliveries USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "idx_deliveries_tracking",
    "indexdef": "CREATE INDEX idx_deliveries_tracking ON public.deliveries USING btree (tracking_number)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "indexname": "idx_deliveries_user",
    "indexdef": "CREATE INDEX idx_deliveries_user ON public.deliveries USING btree (user_id, created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "driver_availability_driver_id_key",
    "indexdef": "CREATE UNIQUE INDEX driver_availability_driver_id_key ON public.driver_availability USING btree (driver_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "driver_availability_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_availability_pkey ON public.driver_availability USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "idx_availability_location",
    "indexdef": "CREATE INDEX idx_availability_location ON public.driver_availability USING btree (current_lat, current_lng) WHERE (is_online = true)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "idx_availability_online",
    "indexdef": "CREATE INDEX idx_availability_online ON public.driver_availability USING btree (is_online, is_busy) WHERE ((is_online = true) AND (is_busy = false))"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "indexname": "driver_documents_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_documents_pkey ON public.driver_documents USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "indexname": "idx_documents_unique_active",
    "indexdef": "CREATE UNIQUE INDEX idx_documents_unique_active ON public.driver_documents USING btree (driver_id, document_type) WHERE (status = ANY (ARRAY['pending'::text, 'approved'::text]))"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "indexname": "idx_driver_documents_driver",
    "indexdef": "CREATE INDEX idx_driver_documents_driver ON public.driver_documents USING btree (driver_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "indexname": "idx_driver_documents_status",
    "indexdef": "CREATE INDEX idx_driver_documents_status ON public.driver_documents USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "indexname": "idx_driver_documents_type",
    "indexdef": "CREATE INDEX idx_driver_documents_type ON public.driver_documents USING btree (document_type)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_vehicles",
    "indexname": "driver_vehicles_driver_id_vehicle_type_is_active_key",
    "indexdef": "CREATE UNIQUE INDEX driver_vehicles_driver_id_vehicle_type_is_active_key ON public.driver_vehicles USING btree (driver_id, vehicle_type, is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_vehicles",
    "indexname": "driver_vehicles_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_vehicles_pkey ON public.driver_vehicles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_vehicles",
    "indexname": "idx_vehicles_driver",
    "indexdef": "CREATE INDEX idx_vehicles_driver ON public.driver_vehicles USING btree (driver_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_vehicles",
    "indexname": "idx_vehicles_plate",
    "indexdef": "CREATE INDEX idx_vehicles_plate ON public.driver_vehicles USING btree (plate)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_driver_status",
    "indexdef": "CREATE INDEX idx_profiles_driver_status ON public.profiles USING btree (driver_status) WHERE (driver_status IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_email",
    "indexdef": "CREATE INDEX idx_profiles_email ON public.profiles USING btree (email)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_role",
    "indexdef": "CREATE INDEX idx_profiles_role ON public.profiles USING btree (role)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_trust_level",
    "indexdef": "CREATE INDEX idx_profiles_trust_level ON public.profiles USING btree (trust_level) WHERE ((role)::text = 'driver'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_email_key",
    "indexdef": "CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "indexname": "idx_rides_driver",
    "indexdef": "CREATE INDEX idx_rides_driver ON public.rides USING btree (driver_id, status)"
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "indexname": "idx_rides_status",
    "indexdef": "CREATE INDEX idx_rides_status ON public.rides USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "indexname": "idx_rides_user",
    "indexdef": "CREATE INDEX idx_rides_user ON public.rides USING btree (user_id, created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "indexname": "rides_pkey",
    "indexdef": "CREATE UNIQUE INDEX rides_pkey ON public.rides USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "indexname": "idx_locations_user_count",
    "indexdef": "CREATE INDEX idx_locations_user_count ON public.saved_locations USING btree (user_id, usage_count DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "indexname": "idx_locations_user_last",
    "indexdef": "CREATE INDEX idx_locations_user_last ON public.saved_locations USING btree (user_id, last_used DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "indexname": "saved_locations_pkey",
    "indexdef": "CREATE UNIQUE INDEX saved_locations_pkey ON public.saved_locations USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "trust_points_config",
    "indexname": "trust_points_config_pkey",
    "indexdef": "CREATE UNIQUE INDEX trust_points_config_pkey ON public.trust_points_config USING btree (reason)"
  },
  {
    "schemaname": "public",
    "tablename": "trust_points_log",
    "indexname": "idx_trust_log_driver",
    "indexdef": "CREATE INDEX idx_trust_log_driver ON public.trust_points_log USING btree (driver_id, created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "trust_points_log",
    "indexname": "idx_trust_log_reason",
    "indexdef": "CREATE INDEX idx_trust_log_reason ON public.trust_points_log USING btree (reason)"
  },
  {
    "schemaname": "public",
    "tablename": "trust_points_log",
    "indexname": "trust_points_log_pkey",
    "indexdef": "CREATE UNIQUE INDEX trust_points_log_pkey ON public.trust_points_log USING btree (id)"
  }
]

[
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "policyname": "Drivers can view assigned deliveries",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = driver_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "policyname": "Users can create own deliveries",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "policyname": "Users can update own deliveries",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "deliveries",
    "policyname": "Users can view own deliveries",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "policyname": "Conductores pueden actualizar sus documentos pendientes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((auth.uid() = driver_id) AND (status = 'pending'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "policyname": "Conductores pueden subir sus documentos",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = driver_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_documents",
    "policyname": "Conductores pueden ver sus documentos",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = driver_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "policyname": "Drivers can view assigned rides",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = driver_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "policyname": "Users can create own rides",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "policyname": "Users can update own rides",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "rides",
    "policyname": "Users can view own rides",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "policyname": "Users can create own locations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "policyname": "Users can delete own locations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "policyname": "Users can update own locations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "saved_locations",
    "policyname": "Users can view own locations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  }
]

[
  {
    "routine_name": "generate_tracking_number",
    "routine_type": "FUNCTION",
    "return_type": "trigger"
  },
  {
    "routine_name": "handle_new_user",
    "routine_type": "FUNCTION",
    "return_type": "trigger"
  },
  {
    "routine_name": "update_driver_trust_points",
    "routine_type": "FUNCTION",
    "return_type": "integer"
  },
  {
    "routine_name": "update_updated_at_column",
    "routine_type": "FUNCTION",
    "return_type": "trigger"
  }
]

[
  {
    "trigger_name": "generate_delivery_tracking",
    "event_manipulation": "INSERT",
    "event_object_table": "deliveries",
    "action_statement": "EXECUTE FUNCTION generate_tracking_number()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_name": "update_deliveries_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "deliveries",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_name": "update_driver_documents_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "driver_documents",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_name": "update_profiles_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "profiles",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_name": "update_rides_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "rides",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_name": "update_locations_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "saved_locations",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  }
]
 -- ============================================
  -- SQL #7: ENUMS (tipos personalizados)
  -- ============================================
Success. No rows returned

[
  {
    "table_name": "trust_points_config",
    "row_count": 14
  },
  {
    "table_name": "profiles",
    "row_count": 2
  },
  {
    "table_name": "deliveries",
    "row_count": 0
  },
  {
    "table_name": "saved_locations",
    "row_count": 0
  },
  {
    "table_name": "driver_vehicles",
    "row_count": 0
  },
  {
    "table_name": "trust_points_log",
    "row_count": 0
  },
  {
    "table_name": "driver_availability",
    "row_count": 0
  },
  {
    "table_name": "driver_documents",
    "row_count": 0
  },
  {
    "table_name": "rides",
    "row_count": 0
  }
]

[
  {
    "id": "driver-documents",
    "name": "driver-documents",
    "owner": null,
    "created_at": "2025-12-08 04:40:55.688661+00",
    "updated_at": "2025-12-08 04:40:55.688661+00",
    "public": false,
    "avif_autodetection": false,
    "file_size_limit": 10485760,
    "allowed_mime_types": [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf"
    ],
    "owner_id": null,
    "type": "STANDARD"
  }
]

[
  {
    "id": "62663712-0ab8-40fe-83bf-5923d7d9d04b",
    "email": "enzomdiaz.99@gmail.com",
    "created_at": "2025-12-07 08:00:28.661853+00",
    "last_sign_in_at": "2025-12-07 08:00:30.349021+00",
    "raw_user_meta_data": {
      "nombre": "Enzo",
      "apellido": "Diaz",
      "telefono": "3364586432",
      "direccion": "Alberdi 421",
      "email_verified": true
    }
  },
  {
    "id": "ff0b6698-8863-4d3f-9da0-cc6b27c52bd6",
    "email": "testuser@gmail.com",
    "created_at": "2025-12-06 21:21:59.003544+00",
    "last_sign_in_at": "2025-12-08 04:52:42.082039+00",
    "raw_user_meta_data": {
      "nombre": "Test",
      "apellido": "User",
      "telefono": "123456789",
      "direccion": "Test direccion",
      "email_verified": true
    }
  }
]

