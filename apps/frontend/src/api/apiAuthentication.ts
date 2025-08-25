import { api } from './apiClient';
import { store } from '../redux/Store';
import { setUserData, setUserFavListing, removeUserFavListing } from '../redux/AppSlice';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UserProfileResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_picture: string | null;
}

type User = {
  id: string | number;
  email: string;
  user_metadata: {
    name: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

const USER_KEY = 'user_data';
const AUTH_DATA_KEY = 'auth_data';
const favKeyFor = (userId: string | number) => `mock_favorites_${userId}`;

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function readFavorites(userId: string | number): Array<string | number> {
  const raw = localStorage.getItem(favKeyFor(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFavorites(userId: string | number, items: Array<string | number>) {
  localStorage.setItem(favKeyFor(userId), JSON.stringify(items));
}

export async function loginWithEmail(email: string, password: string): Promise<User | null> {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  try {
    const loginResponse: LoginResponse = await api.post('/api/auth/login/json', {
      email: email,
      password: password,
    });

    if (loginResponse && loginResponse.access_token) {
      localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(loginResponse));
      const userProfile: UserProfileResponse = await api.get('/api/users/me');

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        user_metadata: {
          name: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          avatarUrl: userProfile.profile_picture,
        },
      };

      persistUser(user);
      store.dispatch(setUserData(user));

      return user;
    }
    return null;
  } catch (error) {
    console.error('Error during login process:', error);
    localStorage.removeItem(AUTH_DATA_KEY);
    localStorage.removeItem(USER_KEY);
    throw error;
  }
}

export async function getUserLogout(): Promise<void> {
  const user = readStoredUser();
  if (user) {
    localStorage.removeItem(favKeyFor(user.id));
  }
  persistUser(null);
  localStorage.removeItem(AUTH_DATA_KEY);
  store.dispatch(setUserData(null));
}

export async function getUserData(): Promise<User | null> {
  const user = readStoredUser();
  if (user) {
    store.dispatch(setUserData(user));
    const favorites = readFavorites(user.id);
    store.dispatch(setUserFavListing(favorites));
    return user;
  }
  return null;
}

export async function signInWithGoogle(): Promise<void> {
  const mockUser: User = {
    id: 'mock-user-google',
    email: 'guest@google.com',
    user_metadata: {
      name: 'Google User',
      firstName: 'Google',
      lastName: 'User',
      avatarUrl: null,
    },
  };
  persistUser(mockUser);
  store.dispatch(setUserData(mockUser));
}

export async function saveFavorite(itemId: string | number): Promise<void> {
  const user = readStoredUser();
  if (!user) throw new Error('User not found');
  const favs = new Set(readFavorites(user.id));
  favs.add(itemId);
  const list = Array.from(favs);
  writeFavorites(user.id, list);
  store.dispatch(setUserFavListing(list));
}

export async function deleteFavorite(itemId: string | number): Promise<void> {
  const user = readStoredUser();
  if (!user) return;
  const list = readFavorites(user.id).filter((it) => it !== itemId);
  writeFavorites(user.id, list);
  store.dispatch(removeUserFavListing(itemId));
}

export async function getFavoriteListing(itemId: string | number): Promise<any> {
  const user = readStoredUser();
  if (!user) return [];
  const list = readFavorites(user.id);
  return list.includes(itemId) ? [{ user_id: user.id, item_id: itemId }] : [];
}

function initializeAuth() {
  const rawAuthData = localStorage.getItem(AUTH_DATA_KEY);
  if (rawAuthData) {
    try {
      const authData: LoginResponse = JSON.parse(rawAuthData);
      if (authData.access_token) {
        const user = readStoredUser();
        if (user) {
          store.dispatch(setUserData(user));
          const favorites = readFavorites(user.id);
          store.dispatch(setUserFavListing(favorites));
        } else {
          getUserLogout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage', error);
      getUserLogout();
    }
  }
}

initializeAuth();
