// Kestrel Stays API Gateway
// Switches transparently between Mock implementation (localStorage + simulated latency)
// and Real FastAPI + PostgreSQL endpoints via NEXT_PUBLIC_USE_MOCK_API.

import * as realAuth from "./endpoints/auth";
import * as mockAuth from "./mock/auth";

import * as realHotels from "./endpoints/hotels";
import * as mockHotels from "./mock/hotels";

import * as realRooms from "./endpoints/rooms";
import * as mockRooms from "./mock/rooms";

import * as realAvailability from "./endpoints/availability";
import * as mockAvailability from "./mock/availability";

import * as realBookings from "./endpoints/bookings";
import * as mockBookings from "./mock/bookings";

import * as realReviews from "./endpoints/reviews";
import * as mockReviews from "./mock/reviews";

import * as realFavorites from "./endpoints/favorites";
import * as mockFavorites from "./mock/favorites";

import * as realUsers from "./endpoints/users";
import * as mockUsers from "./mock/users";

import * as realAdmin from "./endpoints/admin";
import * as mockAdmin from "./mock/admin";

export const USE_MOCK_API =
  process.env.NEXT_PUBLIC_USE_MOCK_API === undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// Auth
export const login = USE_MOCK_API ? mockAuth.mockLogin : realAuth.login;
export const register = USE_MOCK_API ? mockAuth.mockRegister : realAuth.register;
export const getCurrentUser = USE_MOCK_API ? mockAuth.mockGetCurrentUser : realAuth.getCurrentUser;
export const updateProfile = USE_MOCK_API ? mockAuth.mockUpdateProfile : realAuth.updateProfile;
export const changePassword = USE_MOCK_API ? mockAuth.mockChangePassword : realAuth.changePassword;
export const forgotPassword = USE_MOCK_API ? mockAuth.mockForgotPassword : realAuth.forgotPassword;
export const resetPassword = USE_MOCK_API ? mockAuth.mockResetPassword : realAuth.resetPassword;

// Hotels & Destinations
export const searchHotels = USE_MOCK_API ? mockHotels.mockSearchHotels : realHotels.searchHotels;
export const getHotel = USE_MOCK_API ? mockHotels.mockGetHotel : realHotels.getHotel;
export const getFeaturedHotels = USE_MOCK_API ? mockHotels.mockGetFeaturedHotels : realHotels.getFeaturedHotels;
export const getSimilarHotels = USE_MOCK_API ? mockHotels.mockGetSimilarHotels : realHotels.getSimilarHotels;
export const getDestinations = USE_MOCK_API ? mockHotels.mockGetDestinations : realHotels.getDestinations;
export const getDestinationBySlug = USE_MOCK_API ? mockHotels.mockGetDestinationBySlug : realHotels.getDestinationBySlug;

// Rooms & Availability
export const getRoomsForHotel = USE_MOCK_API ? mockRooms.mockGetRoomsForHotel : realRooms.getRoomsForHotel;
export const getRoom = USE_MOCK_API ? mockRooms.mockGetRoom : realRooms.getRoom;
export const getAvailability = USE_MOCK_API ? mockAvailability.mockGetAvailability : realAvailability.getAvailability;

// Bookings
export const listMyBookings = USE_MOCK_API ? mockBookings.mockListMyBookings : realBookings.listMyBookings;
export const getBooking = USE_MOCK_API ? mockBookings.mockGetBooking : realBookings.getBooking;
export const createBooking = USE_MOCK_API ? mockBookings.mockCreateBooking : realBookings.createBooking;
export const cancelBooking = USE_MOCK_API ? mockBookings.mockCancelBooking : realBookings.cancelBooking;
export const modifyBookingDates = USE_MOCK_API ? mockBookings.mockModifyBookingDates : realBookings.modifyBookingDates;

// Reviews
export const getReviewsForHotel = USE_MOCK_API ? mockReviews.mockGetReviewsForHotel : realReviews.getReviewsForHotel;
export const createReview = USE_MOCK_API ? mockReviews.mockCreateReview : realReviews.createReview;
export const listMyReviews = USE_MOCK_API ? mockReviews.mockListMyReviews : realReviews.listMyReviews;

// Favorites
export const listFavorites = USE_MOCK_API ? mockFavorites.mockListFavorites : realFavorites.listFavorites;
export const addFavorite = USE_MOCK_API ? mockFavorites.mockAddFavorite : realFavorites.addFavorite;
export const removeFavorite = USE_MOCK_API ? mockFavorites.mockRemoveFavorite : realFavorites.removeFavorite;

// Admin & Users
export const listUsers = USE_MOCK_API ? mockUsers.mockListUsers : realUsers.listUsers;
export const updateUserRole = USE_MOCK_API ? mockUsers.mockUpdateUserRole : realUsers.updateUserRole;
export const toggleUserActive = USE_MOCK_API ? mockUsers.mockToggleUserActive : realUsers.toggleUserActive;

export const getAdminDashboard = USE_MOCK_API ? mockAdmin.mockGetAdminDashboard : realAdmin.getAdminDashboard;
export const listAllBookings = USE_MOCK_API ? mockAdmin.mockListAllBookings : realAdmin.listAllBookings;
export const updateAdminBookingStatus = USE_MOCK_API ? mockAdmin.mockUpdateAdminBookingStatus : realAdmin.updateAdminBookingStatus;
export const createHotel = USE_MOCK_API ? mockAdmin.mockCreateHotel : realAdmin.createHotel;
export const updateHotel = USE_MOCK_API ? mockAdmin.mockUpdateHotel : realAdmin.updateHotel;
export const deleteHotel = USE_MOCK_API ? mockAdmin.mockDeleteHotel : realAdmin.deleteHotel;
export const createRoom = USE_MOCK_API ? mockAdmin.mockCreateRoom : realAdmin.createRoom;
export const updateRoom = USE_MOCK_API ? mockAdmin.mockUpdateRoom : realAdmin.updateRoom;
export const moderateReview = USE_MOCK_API ? mockAdmin.mockModerateReview : realAdmin.moderateReview;
