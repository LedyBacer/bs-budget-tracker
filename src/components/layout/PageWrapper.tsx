import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <main className="container mx-auto flex-grow p-4">{children}</main>;
}
