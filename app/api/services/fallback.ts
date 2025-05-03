// app/api/services/fallback.ts
// Fallback services data if MongoDB connection fails

export const fallbackServices = [
  {
    _id: "fallback1",
    name: "Joe's Handyman Services",
    description: "Professional handyman services for all your home repair needs.",
    trade: "handyman",
    price: 65,
    priceType: "hourly",
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749] // San Francisco
    },
    userEmail: "joe@example.com",
    phone: "415-555-1234",
    stripeAccountId: "acct_sample123"
  },
  {
    _id: "fallback2",
    name: "Quick Fix Handyman",
    description: "Fast and reliable handyman services for emergencies and routine repairs.",
    trade: "handyman",
    price: 75,
    priceType: "hourly",
    location: {
      type: "Point",
      coordinates: [-122.4341, 37.7325] // Different location in SF
    },
    userEmail: "quickfix@example.com",
    phone: "415-555-7890",
    stripeAccountId: "acct_sample456"
  },
  {
    _id: "fallback3",
    name: "Elite Electricians",
    description: "Licensed electricians for all residential and commercial needs.",
    trade: "electrician",
    price: 95,
    priceType: "hourly",
    location: {
      type: "Point",
      coordinates: [-122.4800, 37.7690] // Another location in SF
    },
    userEmail: "elite@example.com",
    phone: "415-555-3456",
    stripeAccountId: "acct_sample789"
  }
];

export default fallbackServices;
