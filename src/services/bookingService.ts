export interface SessionBooking {
  id: string;
  coachId: string;
  coachName: string;
  athleteName: string;
  athleteEmail: string;
  sessionType: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

class BookingService {
  private readonly BOOKINGS_STORAGE_KEY = 'athletex_session_bookings';

  // Create a new booking
  createBooking(booking: Omit<SessionBooking, 'id' | 'createdAt' | 'status'>): SessionBooking {
    const newBooking: SessionBooking = {
      ...booking,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const bookings = this.getAllBookings();
    bookings.push(newBooking);
    this.saveBookings(bookings);

    return newBooking;
  }

  // Get all bookings
  getAllBookings(): SessionBooking[] {
    const data = localStorage.getItem(this.BOOKINGS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Get bookings for a specific coach
  getBookingsForCoach(coachId: string): SessionBooking[] {
    return this.getAllBookings().filter(booking => booking.coachId === coachId);
  }

  // Get bookings for a specific athlete
  getBookingsForAthlete(athleteEmail: string): SessionBooking[] {
    return this.getAllBookings().filter(booking => booking.athleteEmail === athleteEmail);
  }

  // Update booking status
  updateBookingStatus(bookingId: string, status: SessionBooking['status']): boolean {
    const bookings = this.getAllBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex !== -1) {
      bookings[bookingIndex].status = status;
      this.saveBookings(bookings);
      return true;
    }
    
    return false;
  }

  // Add notes to booking
  addBookingNotes(bookingId: string, notes: string): boolean {
    const bookings = this.getAllBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex !== -1) {
      bookings[bookingIndex].notes = notes;
      this.saveBookings(bookings);
      return true;
    }
    
    return false;
  }

  // Delete a booking
  deleteBooking(bookingId: string): boolean {
    const bookings = this.getAllBookings();
    const filteredBookings = bookings.filter(b => b.id !== bookingId);
    
    if (filteredBookings.length !== bookings.length) {
      this.saveBookings(filteredBookings);
      return true;
    }
    
    return false;
  }

  // Private method to save bookings to localStorage
  private saveBookings(bookings: SessionBooking[]): void {
    localStorage.setItem(this.BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  }

  // Get upcoming bookings for a coach (next 7 days)
  getUpcomingBookingsForCoach(coachId: string): SessionBooking[] {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return this.getBookingsForCoach(coachId).filter(booking => {
      const bookingDate = new Date(booking.sessionDate);
      return bookingDate >= now && bookingDate <= nextWeek && booking.status !== 'cancelled';
    }).sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
  }

  // Get recent bookings for a coach (last 30 days)
  getRecentBookingsForCoach(coachId: string): SessionBooking[] {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return this.getBookingsForCoach(coachId).filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= thirtyDaysAgo && bookingDate <= now;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

const bookingService = new BookingService();
export default bookingService;