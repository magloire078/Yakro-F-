
'use client';

import CustomerHomePage from '@/components/role-specific/customer-home-page';

// With login disabled, this page will always render the customer home page.
export default function HomePage() {
  return <CustomerHomePage />;
}
