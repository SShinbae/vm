/**
 * Supabase Mock Factory
 *
 * Provides configurable Supabase client mocks for testing services.
 * Supports method chaining and customizable responses.
 */

type MockResponse<T = any> = {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number;
};

type QueryBuilderOverrides = {
  selectData?: any;
  insertData?: any;
  updateData?: any;
  deleteData?: any;
  singleData?: any;
  error?: { message: string; code?: string } | null;
  count?: number;
};

/**
 * Creates a mock query builder with chainable methods
 */
export function createMockQueryBuilder(overrides: QueryBuilderOverrides = {}) {
  const mockResponse = (data: any = null, error: any = null) => ({
    data,
    error,
    count: overrides.count ?? null,
  });

  const chainableMethods = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    returns: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue(mockResponse(overrides.singleData, overrides.error)),
    maybeSingle: jest
      .fn()
      .mockResolvedValue(mockResponse(overrides.singleData, overrides.error)),
    then: jest.fn((callback) => {
      const result = mockResponse(overrides.selectData ?? [], overrides.error);
      return Promise.resolve(callback ? callback(result) : result);
    }),
  };

  // Make all chainable methods return the builder
  Object.keys(chainableMethods).forEach((key) => {
    if (key !== "single" && key !== "maybeSingle" && key !== "then") {
      (chainableMethods as any)[key].mockReturnValue(chainableMethods);
    }
  });

  return chainableMethods;
}

/**
 * Creates a complete Supabase client mock
 */
export function createSupabaseMock(
  overrides: {
    auth?: Partial<{
      getUser: jest.Mock;
      getSession: jest.Mock;
      signInWithPassword: jest.Mock;
      signUp: jest.Mock;
      signOut: jest.Mock;
      onAuthStateChange: jest.Mock;
    }>;
    from?: jest.Mock;
    rpc?: jest.Mock;
    storage?: any;
    queryBuilderOverrides?: Record<string, QueryBuilderOverrides>;
  } = {},
) {
  const defaultUser = {
    id: "test-user-id",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const queryBuilders = new Map<
    string,
    ReturnType<typeof createMockQueryBuilder>
  >();

  const getQueryBuilder = (table: string) => {
    if (!queryBuilders.has(table)) {
      const builderOverrides = overrides.queryBuilderOverrides?.[table] ?? {};
      queryBuilders.set(table, createMockQueryBuilder(builderOverrides));
    }
    return queryBuilders.get(table)!;
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: defaultUser },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: defaultUser, access_token: "test-token" } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: defaultUser, session: {} },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: defaultUser, session: {} },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      ...overrides.auth,
    },

    from: (overrides.from ??
      jest.fn((table: string) => getQueryBuilder(table))) as jest.Mock<any>,
    rpc:
      overrides.rpc ?? jest.fn().mockResolvedValue({ data: [], error: null }),
    storage: overrides.storage ?? {
      from: jest.fn(() => ({
        upload: jest
          .fn()
          .mockResolvedValue({ data: { path: "test/path" }, error: null }),
        download: jest
          .fn()
          .mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: "https://test.url" },
        })),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    // Helper to get the query builder for a specific table
    getQueryBuilder,
    // Helper to reset all mocks
    resetMocks: () => {
      queryBuilders.clear();
      jest.clearAllMocks();
    },
  };
}

/**
 * Creates a mock for unauthenticated state
 */
export function createUnauthenticatedMock() {
  return createSupabaseMock({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "User not authenticated", code: "AUTH_ERROR" },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
  });
}

/**
 * Creates a mock with database error
 */
export function createDatabaseErrorMock(errorMessage = "Database error") {
  return createSupabaseMock({
    queryBuilderOverrides: {
      "*": {
        error: { message: errorMessage, code: "DATABASE_ERROR" },
      },
    },
  });
}

/**
 * Mock user factory for testing
 */
export function createMockAuthUser(
  overrides: Partial<{
    id: string;
    email: string;
    role: string;
  }> = {},
) {
  return {
    id: overrides.id ?? "test-user-id",
    email: overrides.email ?? "test@example.com",
    role: overrides.role ?? "authenticated",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };
}

/**
 * Type-safe mock response helper
 */
export function mockApiResponse<T>(
  data: T | null,
  error: string | null = null,
): MockResponse<T> {
  return {
    data,
    error: error ? { message: error } : null,
  };
}

/**
 * Creates mock data builders for common entities
 */
export const MockDataBuilders = {
  vehicle: (overrides = {}) => ({
    id: "vehicle-1",
    user_id: "test-user-id",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    license_plate: "ABC123",
    vin: null,
    main_image_url: null,
    color: "Blue",
    current_mileage: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  fuelLog: (overrides = {}) => ({
    id: "fuel-log-1",
    vehicle_id: "vehicle-1",
    user_id: "test-user-id",
    liters_filled: 45.5,
    cost: 95.0,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 51000,
    location: "Shell Station",
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  serviceLog: (overrides = {}) => ({
    id: "service-log-1",
    vehicle_id: "vehicle-1",
    user_id: "test-user-id",
    service_type: "oil_change",
    description: "Regular oil change",
    cost: 75.0,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 50000,
    next_service_due: null,
    next_service_mileage: null,
    receipt_image_url: null,
    ocr_extracted_data: null,
    auto_filled: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  mileageLog: (overrides = {}) => ({
    id: "mileage-log-1",
    vehicle_id: "vehicle-1",
    user_id: "test-user-id",
    odometer_reading: 50500,
    date: new Date().toISOString().split("T")[0],
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  group: (overrides = {}) => ({
    id: "group-1",
    name: "Family Vehicles",
    description: "Shared family vehicles",
    owner_id: "test-user-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  groupInvitation: (overrides = {}) => ({
    id: "invitation-1",
    group_id: "group-1",
    email: "invitee@example.com",
    invited_by: "test-user-id",
    status: "pending",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),

  profile: (overrides = {}) => ({
    id: "test-user-id",
    email: "test@example.com",
    full_name: "Test User",
    avatar_url: null,
    phone: null,
    bio: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
