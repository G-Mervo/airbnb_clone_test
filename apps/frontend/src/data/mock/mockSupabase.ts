// Minimal TypeScript port of the backup mock Supabase client
/* eslint-disable @typescript-eslint/no-explicit-any */

class MockSupabaseClient {
  currentUser: any;
  tables: Record<string, any[]>;
  auth: any;

  constructor() {
    this.currentUser = null;
    this.auth = {
      signInWithOAuth: async ({ provider }: { provider: string; options?: any }) => {
        // Create a mock user
        this.currentUser = {
          id: "mock-user-id",
          email: "user@example.com",
          user_metadata: { name: "Mock User" },
        };
        localStorage.setItem("mockUser", JSON.stringify(this.currentUser));
        return { user: this.currentUser, error: null };
      },

      signOut: async () => {
        this.currentUser = null;
        localStorage.removeItem("mockUser");
        return { error: null };
      },

      getUser: async () => {
        const storedUser = localStorage.getItem("mockUser");
        if (storedUser && !this.currentUser) {
          this.currentUser = JSON.parse(storedUser);
        }
        return { data: { user: this.currentUser } };
      },

      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        if (!email || !password) {
          return { data: null, error: { message: "Email and password are required" } };
        }
        this.currentUser = {
          id: "mock-user-id",
          email,
          user_metadata: { name: "Guest" },
        };
        localStorage.setItem("mockUser", JSON.stringify(this.currentUser));
        return { data: { user: this.currentUser }, error: null };
      },

      updateUser: async (userData: any) => {
        if (!this.currentUser) {
          return { data: null, error: { message: "No user is currently logged in" } };
        }
        this.currentUser = { ...this.currentUser, ...userData };
        localStorage.setItem("mockUser", JSON.stringify(this.currentUser));
        return { data: { user: this.currentUser }, error: null };
      },
    };

    this.tables = { Rooms: [], Favorites: [], Bookings: [], Payments: [] };
  }

  initMockData(tableName: string, data: any[]) {
    this.tables[tableName] = [...data];
    return this;
  }

  from(tableName: string) {
    return new MockQueryBuilder(tableName, this.tables[tableName], this);
  }
}

class MockQueryBuilder {
  tableName: string;
  data: any[];
  client: MockSupabaseClient;
  filters: Array<(item: any) => boolean> = [];
  rangeStart = 0;
  rangeEnd = 100;
  selectedColumns = "*";
  countEnabled = false;
  singleResult = false;
  insertData: any[] | null = null;
  updateData: any | null = null;
  deleteEnabled = false;
  matchConditions: Record<string, any> = {};

  constructor(tableName: string, data: any[], client: MockSupabaseClient) {
    this.tableName = tableName;
    this.data = [...(data || [])];
    this.client = client;
  }

  select(columns: string, options: any = {}) {
    this.selectedColumns = columns;
    this.countEnabled = options.count === "exact";
    return this;
  }

  range(start: number, end: number) {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this;
    }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
    this.filters.push((item) => regex.test(String(item[column] || "")));
    return this;
  }

  in(column: string, values: any[]) {
    if (!values || values.length === 0) return this;
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  match(conditions: Record<string, any>) {
    this.matchConditions = conditions;
    Object.entries(conditions).forEach(([key, value]) => {
      this.filters.push((item) => item[key] === value);
    });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  insert(data: any) {
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.deleteEnabled = true;
    return this;
  }

  async execute() {
    let result = [...this.data];
    for (const filter of this.filters) result = result.filter(filter);
    result = result.slice(this.rangeStart, Math.min(this.rangeEnd + 1, result.length));
    if (this.singleResult) {
      return { data: result[0] ?? null, error: result[0] ? null : { message: "No matching record found" } };
    }
    return { data: result, count: this.countEnabled ? result.length : undefined, error: null };
  }

  async then(resolve: any) {
    // Handle insert
    if (this.insertData) {
      const newItems = this.insertData.map((item) => {
        if (this.tableName === "Favorites") {
          const currentUser = (this.client.auth.getUser() as any).data?.user;
          if (currentUser && !item.user_id) {
            item.user_id = currentUser.id;
          }
        }
        return { id: `mock-${this.tableName.toLowerCase()}-${Date.now()}`, ...item };
      });
      this.client.tables[this.tableName].push(...newItems);
      resolve(newItems);
      return;
    }

    // Handle update
    if (this.updateData) {
      let result = [...this.data];
      for (const filter of this.filters) result = result.filter(filter);
      const updatedItems = result.map((item) => ({ ...item, ...this.updateData }));
      this.client.tables[this.tableName] = this.client.tables[this.tableName].map((item) => {
        const matching = updatedItems.find((u) => u.id === item.id);
        return matching || item;
      });
      resolve(updatedItems);
      return;
    }

    // Handle delete
    if (this.deleteEnabled) {
      let result = [...this.data];
      for (const filter of this.filters) result = result.filter(filter);
      const idsToDelete = result.map((item) => item.id);
      this.client.tables[this.tableName] = this.client.tables[this.tableName].filter((item) => !idsToDelete.includes(item.id));
      resolve([]);
      return;
    }

    const result = await this.execute();
    if (this.singleResult) {
      resolve(result.data);
      return;
    }
    resolve(result.data ?? []);
  }
}

export function createMockClient() {
  return new MockSupabaseClient();
}


