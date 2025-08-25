import { api } from "./apiClient";

/**
 * API service for handling wishlists
 */
export interface WishlistItem {
	id: string | number;
	wishlist_id: string | number;
	property_id: string | number;
	added_at: string;
}

export interface Wishlist {
	id: string | number;
	user_id: string | number;
	name: string;
	is_public: boolean;
	created_at: string;
	updated_at: string;
	items?: WishlistItem[];
	properties?: any[]; // Property details when included
}

/**
 * Get all wishlists for the current user
 */
export async function getUserWishlists(
	includeProperties: boolean = false
): Promise<Wishlist[]> {
	try {
		const params: Record<string, any> = {
			include_properties: includeProperties,
		};

		const wishlists = await api.get("/wishlists", params);
		return wishlists;
	} catch (error) {
		console.error("Error fetching user wishlists:", error);
		return [];
	}
}

/**
 * Get a specific wishlist by ID
 */
export async function getWishlistById(
	wishlistId: string | number,
	includeProperties: boolean = true
): Promise<Wishlist | null> {
	try {
		const params: Record<string, any> = {
			include_properties: includeProperties,
		};

		const wishlist = await api.get(`/wishlists/${wishlistId}`, params);
		return wishlist;
	} catch (error) {
		console.error(`Error fetching wishlist ${wishlistId}:`, error);
		return null;
	}
}

/**
 * Create a new wishlist
 */
export async function createWishlist(
	name: string,
	isPublic: boolean = false
): Promise<Wishlist | null> {
	try {
		const wishlist = await api.post("/wishlists", {
			name,
			is_public: isPublic,
		});
		return wishlist;
	} catch (error) {
		console.error("Error creating wishlist:", error);
		return null;
	}
}

/**
 * Add a property to a wishlist
 */
export async function addToWishlist(
	propertyId: string | number,
	wishlistName: string = "My Favorites"
): Promise<boolean> {
	try {
		await api.post("/wishlists/add-item", {
			property_id: propertyId,
			name: wishlistName,
		});
		return true;
	} catch (error) {
		console.error(`Error adding property ${propertyId} to wishlist:`, error);
		return false;
	}
}

/**
 * Remove a property from a wishlist
 */
export async function removeFromWishlist(
	propertyId: string | number
): Promise<boolean> {
	try {
		await api.delete(`/wishlists/remove-item/${propertyId}`);
		return true;
	} catch (error) {
		console.error(
			`Error removing property ${propertyId} from wishlist:`,
			error
		);
		return false;
	}
}

/**
 * Check if a property is in any of the user's wishlists
 */
export async function isInWishlist(
	propertyId: string | number
): Promise<boolean> {
	try {
		const response = await api.get(`/wishlists/check-item/${propertyId}`);
		return response?.in_wishlist || false;
	} catch (error) {
		console.error(
			`Error checking if property ${propertyId} is in wishlist:`,
			error
		);
		return false;
	}
}
